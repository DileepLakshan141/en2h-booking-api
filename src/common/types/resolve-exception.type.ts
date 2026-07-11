export type ResolveExceptionType = {
  statusCode: number;
  message: string | string[];
  error: string;
};

export interface DriverAdapterErrorCause {
  originalCode?: string;
  kind?: string;
}

export interface ErrorWithDriverCause {
  cause?: DriverAdapterErrorCause;
}
