import type OpenAI from 'openai';

export interface ServerContext {
  openai: OpenAI;
  chatModel: string;
  imageModel: string;
  useTestPet: boolean;
}
