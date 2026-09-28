import { GatewayDispatchEvents, InteractionType } from '@discordjs/core';

export function create(client) {
  const collectors = new Map();

  const getUserId = interaction => interaction.member?.user?.id ?? interaction.user?.id;
  const getMessageId = interaction => interaction.message?.id;
  
  const remove = collector => {
    const set = collectors.get(collector.messageId);

    if (!set) return;

    set.delete(collector);

    if (!set.size) {
      collectors.delete(collector.messageId);
    }
  };
  
  const acknowledge = async (api, interaction) => {
    try {
      await api.interactions.deferMessageUpdate(interaction.id, interaction.token, {});
    } catch {}
  };
  
  const matches = (collector, interaction) => {
    if (collector.customId && collector.customId !== interaction.data.custom_id) {
      return false;
    }

    if (collector.userId && collector.userId !== getUserId(interaction)) {
      return false;
    }

    return collector.filter ? collector.filter(interaction) : true;
  };

  client.on(
    GatewayDispatchEvents.InteractionCreate,
    async ({ data: interaction, api }) => {
      if (interaction.type !== InteractionType.MessageComponent || interaction.data.component_type !== 2) {
        return;
      }

      const messageId = getMessageId(interaction);
      const activeCollectors = messageId ? collectors.get(messageId) : undefined;

      const collector = [...(activeCollectors ?? [])].find(item => matches(item, interaction));

      if (!collector) {
        await acknowledge(api, interaction);
        return;
      }

      if (collector.once) {
        collector.stop();
      }

      try {
        if (collector.handler) {
          await collector.handler(interaction, api);
        } else {
          await acknowledge(api, interaction);
          collector.resolve({ interaction, api });
        }
      } catch (error) {
        collector.reject(error);
      }
    }
  );

  function createCollector({ messageId, customId, userId, time = 15_000, once = false, filter, handler }) {
    if (!messageId) {
      throw new TypeError('messageId is required');
    }

    const collector = {
      messageId,
      customId,
      userId,
      once,
      filter,
      handler,
      stopped: false,
      timeout: undefined,
      resolve: undefined,
      reject: undefined,
      promise: undefined,
      stop(reason = 'Collector stopped') {
        if (collector.stopped) return;

        collector.stopped = true;
        clearTimeout(collector.timeout);
        remove(collector);

        if (collector.reject) {
          collector.reject(new Error(reason));
        }
      }
    };

    if (!collectors.has(messageId)) {
      collectors.set(messageId, new Set());
    }

    collectors.get(messageId).add(collector);

    if (!handler) {
      collector.promise = new Promise((resolve, reject) => {
        collector.resolve = resolve;
        collector.reject = reject;
      });
    }

    collector.timeout = setTimeout(() => {
      collector.stopped = true;
      remove(collector);

      if (collector.reject) {
        collector.reject(new Error('Collector timed out'));
      }
    }, time);

    return collector;
  }

  function awaitButton(options) {
    return createCollector({
      ...options,
      once: true
    }).promise;
  }

  function collectButtons(options) {
    return createCollector(options);
  }

  function stopAll(messageId) {
    const activeCollectors = collectors.get(messageId);

    if (!activeCollectors) return;

    for (const collector of [...activeCollectors]) {
      collector.stop();
    }
  }

  return {
    awaitButton,
    collectButtons,
    stopAll,
    get size() {
      return [...collectors.values()].reduce((total, set) => total + set.size, 0);
    }
  };
}
