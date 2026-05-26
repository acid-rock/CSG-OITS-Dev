import "@testing-library/jest-dom";
import { vi, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Clean up DOM after each test
afterEach(() => {
  cleanup();
});

// Mock React Router hooks globally
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: "/", search: "", hash: "" }),
    useOutletContext: () => ({
      announcements: [],
      documents: [],
      events: [],
      officers: [],
      committees: [],
      organizations: [],
      equipment: [],
    }),
  };
});

// Mock axios globally — individual tests can override per-call
vi.mock("axios", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
    create: vi.fn().mockReturnThis(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

// Suppress console.log in tests
vi.spyOn(console, "log").mockImplementation(() => {});
