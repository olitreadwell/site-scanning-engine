import { mock, MockProxy } from 'jest-mock-extended';
import { Page } from 'puppeteer';
import { Logger } from 'pino';

import { CoreInputDto } from '../core.input.dto';
import { createPrimaryScanner } from './primary';

describe('primary scanner url-scan guard', () => {
  let mockLogger: MockProxy<Logger>;

  const input: CoreInputDto = {
    websiteId: 1,
    url: '18f.gov',
    filter: false,
    pageviews: 1,
    visits: 1,
    scanId: '123',
  };

  beforeEach(() => {
    mockLogger = mock<Logger>();
    mockLogger.child.mockReturnValue(mockLogger);
  });

  it('yields a null urlScan instead of failing the whole page when url-scan throws', async () => {
    const page = mock<Page>();
    page.url.mockImplementation(() => {
      throw new Error('could not read page url');
    });

    const scanner = await createPrimaryScanner(mockLogger, input);
    const result = await scanner(page);

    expect(result.urlScan).toBeNull();
  });
});
