import { describe, expect, it } from 'vitest';
import { githubStatusFromAccounts } from './githubStatus.ts';

describe('githubStatusFromAccounts', () => {
  it('is ready when the GitHub connected account is ACTIVE', () => {
    expect(
      githubStatusFromAccounts(
        [{ connection_name: 'github-connect', connected_account_status: 'ACTIVE' }],
        'github-connect',
      ),
    ).toEqual({ state: 'ready' });
  });

  it('needs auth when the account is not ACTIVE and a link is present', () => {
    expect(
      githubStatusFromAccounts(
        [
          {
            connection_name: 'github-connect',
            connected_account_status: 'PENDING_AUTH',
            authentication_link: 'https://auth.example/github',
          },
        ],
        'github-connect',
      ),
    ).toEqual({ state: 'needs_auth', authLink: 'https://auth.example/github' });
  });

  it('is missing when no matching connected account exists', () => {
    expect(githubStatusFromAccounts([], 'github-connect')).toEqual({ state: 'missing' });
  });
});
