import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.page').then((m) => m.LoginPageComponent),
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./features/auth/signup/signup.page').then(
        (m) => m.SignupPageComponent,
      ),
  },
  {
    path: 'share/:token',
    loadComponent: () =>
      import('./features/generations/share-view.page').then(
        (m) => m.ShareViewPageComponent,
      ),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.page').then(
            (m) => m.DashboardPageComponent,
          ),
      },
      {
        path: 'articles/:id',
        loadComponent: () =>
          import('./features/articles/article-detail.page').then(
            (m) => m.ArticleDetailPageComponent,
          ),
      },
      {
        path: 'generations/:id',
        loadComponent: () =>
          import('./features/generations/generation-output.page').then(
            (m) => m.GenerationOutputPageComponent,
          ),
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./features/history/history.page').then(
            (m) => m.HistoryPageComponent,
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.page').then(
            (m) => m.SettingsPageComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
