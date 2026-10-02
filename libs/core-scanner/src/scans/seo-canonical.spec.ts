import { mock } from 'jest-mock-extended';
import { Logger } from 'pino';
import { HTTPResponse, Page } from 'puppeteer';
import { buildSeoResult } from './seo';

// A page with no SEO targets of its own, so buildSeoResult falls back to the
// Link response header for the canonical URL.
const pageWithNoScanTargets = (): Page => {
  const page = mock<Page>();
  page.evaluate.mockResolvedValue(null);
  return page;
};

const responseWithLinkHeader = (link: string): HTTPResponse =>
  mock<HTTPResponse>({ headers: jest.fn().mockResolvedValue({ link }) });

const canonicalFromHeader = async (link: string): Promise<string> => {
  const result = await buildSeoResult(
    mock<Logger>(),
    pageWithNoScanTargets(),
    responseWithLinkHeader(link),
  );

  return result.canonicalLink;
};

describe('seo scan canonical link from the Link response header', () => {
  it('strips the angle brackets around the canonical target', async () => {
    expect(
      await canonicalFromHeader('<https://www.example.gov/>; rel="canonical"'),
    ).toBe('https://www.example.gov/');
  });

  it('accepts an unquoted rel value', async () => {
    expect(
      await canonicalFromHeader(
        '<https://www.example.gov/page>; rel=canonical',
      ),
    ).toBe('https://www.example.gov/page');
  });

  it('picks the canonical entry out of several link values', async () => {
    expect(
      await canonicalFromHeader(
        '<https://www.example.gov/asset.css>; rel=preload; as=style, <https://www.example.gov/>; rel="canonical"',
      ),
    ).toBe('https://www.example.gov/');
  });

  it('ignores a link header without a canonical relation', async () => {
    expect(
      await canonicalFromHeader('<https://www.example.gov/>; rel="preconnect"'),
    ).toBeNull();
  });
});
