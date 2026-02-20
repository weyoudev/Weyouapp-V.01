/**
 * RolesGuard: OPS gets 403 on ADMIN/BILLING-only endpoints; ADMIN/OPS/BILLING allowed where configured.
 */
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@shared/enums';
import { RolesGuard } from '../roles.guard';

function createMockContext(request: { user?: { id: string; role: Role } }): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows access when user role is in required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN, Role.OPS]);
    const ctx = createMockContext({ user: { id: 'u1', role: Role.OPS } });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws ForbiddenException with "Insufficient permissions" when user role is not allowed', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN, Role.BILLING]);
    const ctx = createMockContext({ user: { id: 'u1', role: Role.OPS } });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctx)).toThrow('Insufficient permissions');
  });

  it('returns false when request has no user', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const ctx = createMockContext({});
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('allows access when no roles metadata (no restriction)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = createMockContext({ user: { id: 'u1', role: Role.OPS } });
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
