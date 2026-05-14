import Papa from "papaparse";

export interface ParsedCsvRow extends Record<string, string> {}

export function useCsv() {
  const parseFile = (file: File) =>
    new Promise<{ data: ParsedCsvRow[]; errors: Papa.ParseError[] }>((resolve, reject) => {
      Papa.parse<ParsedCsvRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => resolve({ data: res.data, errors: res.errors }),
        error: (err) => reject(err),
      });
    });

  return { parseFile };
}
