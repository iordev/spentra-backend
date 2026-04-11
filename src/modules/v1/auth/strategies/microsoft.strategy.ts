import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-microsoft';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(
    private config: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: config.get<string>('MICROSOFT_CLIENT_ID')!,
      clientSecret: config.get<string>('MICROSOFT_CLIENT_SECRET')!,
      callbackURL: config.get<string>('MICROSOFT_CALLBACK_URL')!,
      scope: ['user.read'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: {
      emails?: { value: string }[];
      name?: { givenName?: string; familyName?: string };
      photos?: { value: string }[];
    },
  ) {
    const { emails, name, photos } = profile;

    return this.authService.getOAuthProfile({
      email: emails?.[0].value ?? '',
      firstName: name?.givenName ?? '',
      lastName: name?.familyName ?? '',
      avatarUrl: photos?.[0].value ?? null,
      provider: 'microsoft',
    });
  }
}
