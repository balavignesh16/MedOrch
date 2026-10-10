import { describe, expect, it } from 'vitest';
import { MAX_BAR_CATEGORIES, chooseChart } from './assistantChart';

describe('chooseChart', () => {
  it('draws a bar chart for one categorical and one numeric column, labelling nulls', () => {
    const spec = chooseChart(['race', 'readmission_count'], [['Caucasian', 8592], [null, 188], ['Asian', 65]]);
    expect(spec).toEqual({
      type: 'bar',
      categoryLabel: 'race',
      valueLabel: 'readmission_count',
      data: [
        { category: 'Caucasian', value: 8592 },
        { category: 'Unknown', value: 188 },
        { category: 'Asian', value: 65 },
      ],
    });
  });

  it('draws a scatter plot for two numeric columns', () => {
    const spec = chooseChart(['days', 'meds'], [[1, 5], [2, 9], [3, 11], [4, 14]]);
    expect(spec?.type).toBe('scatter');
    if (spec?.type === 'scatter') expect(spec.data).toHaveLength(4);
  });

  it('treats an integer-coded category as numeric rather than guessing labels', () => {
    expect(chooseChart(['admission_type_id', 'n'], [[1, 100], [2, 50], [3, 25]])?.type).toBe('scatter');
  });

  it('declines when the shape is not chartable', () => {
    expect(chooseChart(['count'], [[46902]])).toBeNull();
    expect(chooseChart(['a', 'b', 'c'], [['x', 1, 2], ['y', 3, 4]])).toBeNull();
    expect(chooseChart(['race', 'n'], [['Caucasian', 5]])).toBeNull();
    expect(chooseChart(['a', 'b'], [['x', 'y'], ['z', 'w']])).toBeNull();
    expect(chooseChart(undefined, undefined)).toBeNull();
    expect(chooseChart(['a', 'b'], [[1, 2], [2, 3]])).toBeNull();
  });

  it('declines bar charts with too many categories, and scatter plots with too few points', () => {
    const many = Array.from({ length: MAX_BAR_CATEGORIES + 1 }, (_, i) => [`c${i}`, i]);
    expect(chooseChart(['k', 'v'], many)).toBeNull();
    expect(chooseChart(['x', 'y'], [[1, 2], [2, 3]])).toBeNull();
  });

  it('never charts a column that mixes numbers and text', () => {
    expect(chooseChart(['a', 'b'], [['x', 1], [2, 3]])).toBeNull();
  });
});
