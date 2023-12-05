// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const LEDGER_CONFIG = {
  derivationPath: "44'/635'/0'/0/0",
  exchangeTimeout: 75_000,
  updateDerivationPath: function (index: number): void {
    this.derivationPath = this.generateDerivationPath(index);
  },
  generateDerivationPath: function (index: number): string {
    return `44'/635'/${index}'/0/0`;
  },
};
