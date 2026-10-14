import { promises as fs } from 'fs';
import { join } from 'path';
import { Result } from 'axe-core';
import { aggregateResults } from './results-aggregator';

async function readJsonFile(filePath) {
  try {
    const jsonString = await fs.readFile(filePath, 'utf8');
    const jsonObject = JSON.parse(jsonString);
    return jsonObject;
  } catch (error) {
    console.error('Error reading the file:', error);
  }
}

describe('aggregateResults', () => {
  it('should aggregate results from a list of one result', async () => {
    const results: Result[] = await readJsonFile(
      join(__dirname, './test-fixtures/results1Raw.json'),
    );

    const result = aggregateResults(results);

    const expectedResult = await readJsonFile(
      join(__dirname, './test-fixtures/results1Expected.json'),
    );

    expect(result.resultsList.length).toEqual(1);
  });

  it('should aggregate results from a list of two results', async () => {
    const results: Result[] = await readJsonFile(
      join(__dirname, './test-fixtures/results2Raw.json'),
    );

    const result = aggregateResults(results);

    const expectedResult = await readJsonFile(
      join(__dirname, './test-fixtures/results2Expected.json'),
    );

    expect(result.resultsList.length).toEqual(2);
  });

  it('should aggregate results from the "other" category of audits', async () => {
    const results: Result[] = await readJsonFile(
      join(__dirname, './test-fixtures/results3Raw.json'),
    );

    const result = aggregateResults(results);

    expect(result.resultsSummary).toHaveProperty('other');
    expect(result.resultsSummary['other']).toEqual(5);
    expect(result.resultsList.length).toEqual(4);
    expect(result.resultsList[0].id).toEqual('video-caption');
    expect(result.resultsList[1].id).toEqual('label');
    expect(result.resultsList[2].id).toEqual('autocomplete-valid');
    expect(result.resultsList[3].id).toEqual('link-in-text-block');
  });

  it('should aggregate an input-button-name violation into the form-names category', () => {
    const results: Result[] = [
      {
        id: 'input-button-name',
        impact: 'serious',
        tags: ['cat.name-role-value', 'wcag2a', 'wcag412', 'section508'],
        description: 'Ensures input buttons have discernible text',
        help: 'Input buttons must have discernible text',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.11/input-button-name',
        nodes: [
          {
            html: '<input type="submit">',
            impact: 'serious',
            target: ['input'],
            any: [],
            all: [],
            none: [
              {
                id: 'input-button-name',
                impact: 'serious',
                message: 'Element does not have a discernible text',
                data: null,
                relatedNodes: [],
              },
            ],
          },
        ],
      },
    ];

    const result = aggregateResults(results);

    expect(result.resultsSummary).toHaveProperty('form-names');
    expect(result.resultsSummary['form-names']).toEqual(1);
    expect(result.resultsList.map((entry) => entry.id)).toEqual([
      'input-button-name',
    ]);
  });
});
