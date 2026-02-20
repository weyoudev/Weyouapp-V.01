import { IsString, MaxLength, MinLength } from 'class-validator';

/** Expo push token for sending push notifications when app is in background or closed. */
export class PushTokenDto {
  @IsString()
  @MinLength(10)
  @MaxLength(256)
  pushToken: string;
}
