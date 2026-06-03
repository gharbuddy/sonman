declare module "paytmpayments-allinone-react-native" {
  type PaytmTransactionResult = Record<string, unknown>;

  const AllInOneSDKManager: {
    startTransaction(
      orderId: string,
      mid: string,
      txnToken: string,
      amount: string,
      callbackUrl: string,
      isStaging: boolean,
      restrictAppInvoke: boolean,
      urlScheme: string
    ): Promise<PaytmTransactionResult>;
  };

  export default AllInOneSDKManager;
}
