import { importProvidersFrom } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

export const appConfig = {
  providers: [
    importProvidersFrom(
      RouterModule.forRoot([]), // rutas si tienes
      FormsModule              // necesario si usas ngModel en formularios
    )
  ]
};
