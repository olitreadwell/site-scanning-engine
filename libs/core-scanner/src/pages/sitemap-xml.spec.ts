import { mock, MockProxy } from 'jest-mock-extended';
import { Logger } from 'pino';
import { Page, HTTPRequest, HTTPResponse } from 'puppeteer';
import { HttpService } from '@nestjs/axios';

import { createSitemapXmlScanner, getSitemapUsingAxios } from './sitemap-xml';
import { source } from './test-page-source';
import {
  stubHttpGet,
  stubRedirectedNavigation,
  testInput,
} from './test-helpers';

describe('sitemap-xml scanner', () => {
  let mockPage: MockProxy<Page>;
  let redirectRequest: MockProxy<HTTPRequest>;
  let mockResponse: MockProxy<HTTPResponse>;
  let mockLogger: MockProxy<Logger>;
  const finalUrl = 'https://18f.gsa.gov';
  const input: CoreInputDto = {
    websiteId: 1,
    url: '18f.gov',
    filter: false,
    pageviews: 1,
    visits: 1,
    scanId: '123',
  };

  beforeEach(async () => {
    mockPage = mock<Page>();
    mockLogger = mock<Logger>();
    ({ redirectRequest, mockResponse } = stubRedirectedNavigation(
      mockPage,
      'text/xml; charset=utf-8',
      finalUrl,
    ));
  });

  it('should scan for a sitemap-xml page', async () => {
    mockResponse.text.mockResolvedValue(source);
    mockResponse.url.mockReturnValue('https://18f.gsa.gov/sitemap.xml');
    mockPage.goto.mockResolvedValue(mockResponse);
    redirectRequest.redirectChain.mockReturnValue([]);
    const mockHttpService = mock<HttpService>();
    stubHttpGet(mockHttpService, 404, 'Not Found');

    const scanner = createSitemapXmlScanner(
      mockLogger,
      testInput,
      mockHttpService,
    );
    const result = await scanner(mockPage);

    expect(result).toEqual({
      sitemapXmlScan: {
        sitemapXmlCount: undefined,
        sitemapXmlFinalUrlFilesize: 15,
        sitemapXmlPdfCount: 0,
        sitemapXmlFinalUrl: 'https://18f.gsa.gov/sitemap.xml',
        sitemapXmlFinalUrlLive: true,
        sitemapTargetUrlRedirects: true,
        sitemapXmlFinalUrlMimeType: 'text/xml',
        sitemapXmlLastMod: null,
        sitemapXmlPageHash: null,
        sitemapXmlStatusCode: 200,
        sitemapXmlDetected: true,
      },
    });
  });

  it('parses a DD/MM/YYYY <lastmod> date that the native Date parser rejects', async () => {
    mockResponse.url.mockReturnValue('https://18f.gsa.gov/sitemap.xml');
    mockPage.goto.mockResolvedValue(mockResponse);
    redirectRequest.redirectChain.mockReturnValue([]);
    const mockHttpService = mock<HttpService>();
    const axiosResponse: AxiosResponse<any> = {
      data: '<urlset><url><loc>https://example.gov/</loc><lastmod>20/02/2025</lastmod></url></urlset>',
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        headers: null,
      },
    };
    jest
      .spyOn(mockHttpService, 'get')
      .mockImplementationOnce(() => of(axiosResponse));

    const scanner = createSitemapXmlScanner(mockLogger, input, mockHttpService);
    const result = await scanner(mockPage);

    expect(result.sitemapXmlScan.sitemapXmlLastMod).toEqual(
      '2025-02-20T00:00:00.000Z',
    );
  });

  it('detects and parses a DD/MM/YYYY date in a <td> tag', async () => {
    mockResponse.url.mockReturnValue('https://18f.gsa.gov/sitemap.xml');
    mockPage.goto.mockResolvedValue(mockResponse);
    redirectRequest.redirectChain.mockReturnValue([]);
    (mockPage.$$eval as unknown as jest.Mock).mockResolvedValue(['20/02/2025']);
    const mockHttpService = mock<HttpService>();
    const axiosResponse: AxiosResponse<any> = {
      data: '<html><body><table><tr><td>20/02/2025</td></tr></table></body></html>',
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        headers: null,
      },
    };
    jest
      .spyOn(mockHttpService, 'get')
      .mockImplementationOnce(() => of(axiosResponse));

    const scanner = createSitemapXmlScanner(mockLogger, input, mockHttpService);
    const result = await scanner(mockPage);

    expect(result.sitemapXmlScan.sitemapXmlLastMod).toEqual(
      '2025-02-20T00:00:00.000Z',
    );
  });

  it('degrades gracefully when navigation resolves to a null response', async () => {
    mockPage.goto.mockResolvedValue(null);
    mockPage.url.mockReturnValue('https://18f.gov/sitemap.xml');
    const mockHttpService = mock<HttpService>();

    const scanner = createSitemapXmlScanner(
      mockLogger,
      testInput,
      mockHttpService,
    );
    const result = await scanner(mockPage);

    // Without a response the sitemap can't be detected, so its body is never used.
    expect(mockHttpService.get).not.toHaveBeenCalled();
    expect(mockLogger.info).not.toHaveBeenCalledWith('Got sitemap.xml!');
    expect(result).toEqual({
      sitemapXmlScan: {
        sitemapXmlFinalUrl: 'https://18f.gov/sitemap.xml',
        sitemapXmlFinalUrlLive: false,
        sitemapTargetUrlRedirects: null,
        sitemapXmlFinalUrlMimeType: 'none-specified',
        sitemapXmlStatusCode: null,
        sitemapXmlDetected: false,
      },
    });
  });
});
