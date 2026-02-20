import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { Role } from '@shared/enums';
import type { AuthUser } from './roles.guard';

interface JwtPayload {
  sub: string;
  role: Role;
  phone?: string | null;
  email?: string | null;
  branchId?: string | null;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'] as string | undefined;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Authorization header');
    }
    const token = authHeader.slice('Bearer '.length);
    const secret = process.env.JWT_SECRET || 'dev-secret';
    try {
      const payload = jwt.verify(token, secret) as JwtPayload;
      const user: AuthUser = {
        id: payload.sub,
        role: payload.role,
        phone: payload.phone,
        email: payload.email,
        branchId: payload.branchId ?? null,
      };
      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

