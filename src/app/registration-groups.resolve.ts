import { Injectable } from '@angular/core';
import { Resolve, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { GroupForRegistration } from 'app/api/models';
import { UsersService } from 'app/api/services';
import { Observable } from 'rxjs/Observable';
import { tap } from 'rxjs/operators/tap';
import { SingletonResolve } from 'app/singleton.resolve';

/**
 * Loads the possible groups for registration
 */
@Injectable()
export class RegistrationGroupsResolve extends SingletonResolve<GroupForRegistration[]> {
  constructor(
    private usersService: UsersService
  ) {
    super();
  }

  fetch(): Observable<GroupForRegistration[]> {
    return this.usersService.getGroupsForUserRegistration({});
  }
}
