import { AbstractConsumption, AbstractCurrentConsumption } from './Consumption';
import { ChargePointStatus, OCPP15TransactionData, OCPPMeterValue } from './ocpp/OCPPServer';

import { BillingTransactionData } from './Billing';
import ChargingStation from '../types/ChargingStation';
import { OCPICdr } from './ocpi/OCPICdr';
import { OCPISession } from './ocpi/OCPISession';
import { RefundTransactionData } from './Refund';
import User from './User';

export type InactivityStatusLevel =
 'info' |
 'warning' |
 'danger'
;

export enum InactivityStatus {
  INFO = 'I',
  WARNING = 'W',
  ERROR = 'E'
}

export enum TransactionAction {
  START = 'start',
  UPDATE = 'update',
  STOP = 'stop',
  END = 'end'
}

export default interface Transaction extends AbstractCurrentConsumption {
  id?: number;
  carID?: string;
  siteID?: string;
  siteAreaID?: string;
  issuer: boolean;
  connectorId: number;
  tagID: string;
  userID: string;
  chargeBoxID: string;
  signedData?: string;
  user?: User;
  stop?: TransactionStop;
  remotestop?: {
    timestamp: Date;
    tagID: string;
    userID: string;
  };
  refundData?: RefundTransactionData;
  chargeBox?: ChargingStation;
  meterStart: number;
  timestamp: Date;
  price?: number;
  roundedPrice?: number;
  priceUnit?: string;
  pricingSource?: string;
  stateOfCharge: number;
  timezone: string;
  currentTimestamp?: Date;
  currentTotalInactivitySecs: number;
  currentInactivityStatus?: InactivityStatus;
  currentStateOfCharge: number;
  currentTotalDurationSecs?: number;
  transactionEndReceived?: boolean;
  currentCumulatedPrice?: number;
  currentTotalConsumptionWh: number;
  currentSignedData?: string;
  status?: ChargePointStatus;
  numberOfMeterValues: number;
  uniqueId?: string;
  values?: TransactionConsumption[];
  billingData?: BillingTransactionData;
  ocpiData?: {
    session?: OCPISession;
    cdr?: OCPICdr;
    sessionCheckedOn?: Date;
    cdrCheckedOn?: Date;
  };
}

export interface TransactionStop {
  timestamp: Date;
  meterStop: number;
  tagID: string;
  userID: string;
  user?: User;
  price?: number;
  roundedPrice?: number;
  priceUnit?: string;
  pricingSource?: string;
  stateOfCharge?: number;
  totalInactivitySecs?: number;
  extraInactivitySecs?: number;
  extraInactivityComputed?: boolean;
  totalConsumptionWh?: number;
  totalDurationSecs?: number;
  inactivityStatus?: InactivityStatus;
  transactionData?: OCPP15TransactionData|OCPPMeterValue[];
  signedData?: string;
}

export interface TransactionConsumption extends AbstractConsumption {
  date: Date;
  limitWatts: number;
  limitAmps: number;
  cumulatedConsumptionWh: number;
  cumulatedConsumptionAmps: number;
  stateOfCharge: number;
  cumulatedAmount: number;
}
