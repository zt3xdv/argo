import { Routes } from '@discordjs/core';

export async function getLatency(rest) {
  const start = performance.now()
  await rest.get(Routes.gateway())
  return Math.round(performance.now() - start)
}
