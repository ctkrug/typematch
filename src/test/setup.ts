import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Unmount between tests so a leaked tree can't make the next test pass.
afterEach(cleanup);
