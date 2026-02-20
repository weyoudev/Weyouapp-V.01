import { IsString } from 'class-validator';

export class PurchaseSubscriptionDto {
  @IsString()
  planId!: string;

  /** Address this subscription is tied to (pincode determines branch). Cannot be changed after purchase. */
  @IsString()
  addressId!: string;
}
