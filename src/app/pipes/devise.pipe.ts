import { Pipe, PipeTransform } from '@angular/core';
import { ConfigService } from '../services/config.service';

/** Retourne la devise configurée (ex : 'XOF') pour usage dans currency pipe. */
@Pipe({ name: 'devise' })
export class DevisePipe implements PipeTransform {
  constructor(private configService: ConfigService) {}
  transform(_: any): string {
    return this.configService.config.devise || 'XOF';
  }
}
