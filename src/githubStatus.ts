export type ConnectedAccount = {
  connection_name?: string;
  connected_account_status?: string;
  authentication_link?: string;
};

export type GithubStatus =
  | { state: 'ready' }
  | { state: 'needs_auth'; authLink: string }
  | { state: 'missing' };

export function githubStatusFromAccounts(
  accounts: ConnectedAccount[],
  connectionName: string,
): GithubStatus {
  const account = accounts.find((item) => item.connection_name === connectionName);
  if (!account) {
    return { state: 'missing' };
  }
  if (account.connected_account_status === 'ACTIVE') {
    return { state: 'ready' };
  }
  if (account.authentication_link) {
    return { state: 'needs_auth', authLink: account.authentication_link };
  }
  return { state: 'missing' };
}
