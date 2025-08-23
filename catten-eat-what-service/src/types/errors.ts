export class PreferenceValidationError extends Error {
  details: Record<string, string>;

  constructor(message: string, details: Record<string, string>) {
    super(message);
    this.name = 'PreferenceValidationError';
    this.details = details;
  }
}
