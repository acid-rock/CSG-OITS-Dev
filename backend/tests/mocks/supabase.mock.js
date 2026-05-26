import { vi } from 'vitest';

/**
 * Creates a chainable Supabase query mock.
 * The returned object is both chainable (each method returns `this`)
 * and thenable (so `await chain` resolves to resolvedValue).
 */
export function createQueryChain(resolvedValue = { data: [], error: null }) {
  const promise = Promise.resolve(resolvedValue);

  const chain = {
    select:      vi.fn().mockReturnThis(),
    insert:      vi.fn().mockReturnThis(),
    update:      vi.fn().mockReturnThis(),
    upsert:      vi.fn().mockReturnThis(),
    delete:      vi.fn().mockReturnThis(),
    eq:          vi.fn().mockReturnThis(),
    neq:         vi.fn().mockReturnThis(),
    is:          vi.fn().mockReturnThis(),
    not:         vi.fn().mockReturnThis(),
    in:          vi.fn().mockReturnThis(),
    order:       vi.fn().mockReturnThis(),
    limit:       vi.fn().mockReturnThis(),
    range:       vi.fn().mockReturnThis(),
    single:      vi.fn().mockResolvedValue(resolvedValue),
    maybeSingle: vi.fn().mockResolvedValue(resolvedValue),
    then:        promise.then.bind(promise),
    catch:       promise.catch.bind(promise),
  };

  return chain;
}

/**
 * Creates the full Supabase client mock.
 */
export function createSupabaseMock() {
  const mockFrom = vi.fn(() => createQueryChain());

  const mockStorage = {
    from: vi.fn(() => ({
      upload: vi.fn().mockResolvedValue({ data: { path: 'test/file.jpg', id: 'test-storage-id' }, error: null }),
      remove: vi.fn().mockResolvedValue({ data: [], error: null }),
      copy:   vi.fn().mockResolvedValue({ data: {}, error: null }),
      list:   vi.fn().mockResolvedValue({ data: [], error: null }),
      download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/test/file.jpg' },
      }),
    })),
  };

  const mockAuth = {
    admin: {
      listUsers: vi.fn().mockResolvedValue({ data: { users: [] }, error: null }),
      createUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-uuid', email: 'test@admin.com' } },
        error: null,
      }),
    },
    signInWithPassword: vi.fn().mockResolvedValue({
      data: {
        session: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
        },
        user: { id: 'test-uuid', email: 'test@admin.com' },
      },
      error: null,
    }),
    refreshSession: vi.fn().mockResolvedValue({
      data: { session: null },
      error: { message: 'Session expired' },
    }),
  };

  return {
    from: mockFrom,
    storage: mockStorage,
    auth: mockAuth,
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
}

/**
 * Configure a specific .from(tableName) call to return custom data.
 *
 * Usage:
 *   const mock = createSupabaseMock();
 *   mockFromTable(mock, 'bulletin', { data: [{ id: '1', title: 'Test' }], error: null });
 */
export function mockFromTable(supabaseMock, tableName, resolvedValue) {
  supabaseMock.from.mockImplementation((table) => {
    if (table === tableName) return createQueryChain(resolvedValue);
    return createQueryChain({ data: [], error: null });
  });
}
