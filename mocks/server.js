// JestのテストではMSWのサーバーをモックするだけにして、実際のハンドラーは使用しない
export const server = {
  listen: jest.fn(),
  resetHandlers: jest.fn(),
  close: jest.fn(),
};
