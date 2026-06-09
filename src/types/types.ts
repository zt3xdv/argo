export const RequestMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
} as const;

export const ResponseType = {
  TEXT: 'TEXT',
  JSON: 'JSON',
  BUFFER: 'BUFFER',
} as const;

export type RequestMethod = typeof RequestMethod[keyof typeof RequestMethod];
export type ResponseType = typeof ResponseType[keyof typeof ResponseType];

export type RequestResponse = {
  [RequestMethod.GET]: any;
} & {
  [K in ResponseType]: K extends typeof ResponseType.TEXT ? string
                     : K extends typeof ResponseType.BUFFER ? Buffer
                     : { [key: string]: any };
};

export type RequestOptions<Type extends ResponseType> = {
  method: RequestMethod;
  body?: any;
  response?: Type;
  params?: { [key: string]: string | number };
  timeout?: number;
  headers?: Record<string, string>;
};
