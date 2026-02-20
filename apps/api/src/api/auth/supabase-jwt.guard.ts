import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

export interface SupabaseJwtPayload {
  sub: string;
  phone?: string;
  email?: string;
  role?: string;
}

@Injectable()
export class SupabaseJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const auth = req.headers.authorization;
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }
    const secret = process.env.SUPABASE_JWT_SECRET;
    if (!secret) {
      throw new UnauthorizedException('Server configuration error');
    }
    try {
      const payload = jwt.verify(token, secret) as SupabaseJwtPayload;
      if (!payload.sub) {
        throw new UnauthorizedException('Invalid token payload');
      }
      (req as Request & { supabaseUser: SupabaseJwtPayload }).supabaseUser = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
