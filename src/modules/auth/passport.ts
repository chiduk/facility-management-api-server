import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import passport from 'passport';
import tokenTypes from '../token/token.types';
import config from '../../config/config';
import User from '../user/user.model';
import { IPayload } from '../token/token.interfaces';
import { toObjectId } from '../utils';

const jwtStrategy = new JwtStrategy(
  {
    secretOrKey: config.jwt.secret,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  },
  async (payload: IPayload, done) => {
    try {
      if (payload.type !== tokenTypes.ACCESS) {
        throw new Error('Invalid token type');
      }

      const user = await User.findById(payload.sub);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      done(error, false);
    }
  }
);

const jwtExpirationStrategy = new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.jwt.secret,
    ignoreExpiration: true,
  },
  async (payload, done) => {
    try {
      if (!payload) {
        return done(new Error('No token provided'), false);
      }
      if (!payload.sub) done('Invalid Token');
      const userId = payload.sub;

      const user = await User.findOne({
        _id: toObjectId(userId),
      });
      if (!user) return done('err');
      done(null, user);
    } catch (error) {
      done(error, false);
    }
  }
);

passport.use('jwt', jwtStrategy);
passport.use('jwtExpiration', jwtExpirationStrategy);

export default passport;
