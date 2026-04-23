import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "./Login";

const mockLogin = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    login: mockLogin,
    isLoggingIn: false,
  }),
}));

describe("LoginPage Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("full login flow: fill form → submit → calls login mutation", async () => {
    mockLogin.mockResolvedValue({
      user: { id: 1, email: "test@test.com", name: "Test User" },
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <LoginPage />
      </MemoryRouter>
    );

    // Fill form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await userEvent.type(emailInput, "test@test.com");
    await userEvent.type(passwordInput, "password123");

    // Submit form
    await userEvent.click(submitButton);

    // Verify login was called with correct data
    expect(mockLogin).toHaveBeenCalledWith({
      email: "test@test.com",
      password: "password123",
    });
  });
});
