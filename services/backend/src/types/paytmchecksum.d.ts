declare module "paytmchecksum" {
  const PaytmChecksum: {
    generateSignature(params: string | Record<string, unknown>, key: string): Promise<string>;
    verifySignature(
      params: string | Record<string, unknown>,
      key: string,
      checksum: string
    ): boolean | Promise<boolean>;
  };

  export default PaytmChecksum;
}
