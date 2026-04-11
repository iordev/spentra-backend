import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    private config: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: config.get<string>('FACEBOOK_CLIENT_ID')!,
      clientSecret: config.get<string>('FACEBOOK_CLIENT_SECRET')!,
      callbackURL: config.get<string>('FACEBOOK_CALLBACK_URL')!,
      scope: ['email', 'public_profile'],
      profileFields: ['id', 'emails', 'name', 'photos'],
    });
  }

  async validate(_accessToken: string, _refreshToken: string, profile: Profile) {
    const { emails, name, photos } = profile;

    return this.authService.getOAuthProfile({
      email: emails?.[0].value ?? '',
      firstName: name?.givenName ?? '',
      lastName: name?.familyName ?? '',
      avatarUrl: photos?.[0].value ?? null,
      provider: 'facebook',
    });
  }
}
