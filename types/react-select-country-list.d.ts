declare module 'react-select-country-list' {
    export type Country = {
        value: string;
        label: string;
    };

    interface CountryList {
        getData(): Country[];
        getLabel(code: string): string;
        getValue(label: string): string;
        getValues(): string[];
        getLabels(): string[];
        setLabel(value: string, label: string): void;
        setLabels(labels: Record<string, string>): void;
    }

    const countryList: () => CountryList;
    export default countryList;
}