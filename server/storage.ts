// No server-side storage needed for this app
export interface IStorage {}
export class MemStorage implements IStorage {}
export const storage = new MemStorage();
