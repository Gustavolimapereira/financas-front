import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountsTable } from "@/components/entries/accounts-table";

const apiRequestMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api-client", () => ({ apiRequest: apiRequestMock }));

const account = {
  id: "conta-1",
  lugar: "Conta de energia",
  valor: "185.90",
  origem: "MANUAL",
  nomeArquivo: null,
  mesReferencia: "2026-08",
  inseridoEm: "2026-08-20T10:00:00.000Z",
  tipo: "SAIDA",
};

describe("gerenciamento de contas", () => {
  beforeEach(() => {
    apiRequestMock.mockImplementation(async (_path: string, init?: RequestInit) => {
      if (init?.method === "PATCH") return { ...account, lugar: "Conta de luz" };
      if (init?.method === "DELETE") return undefined;
      return { entries: [account], page: 1, totalPages: 1, hasNextPage: false };
    });
  });

  afterEach(() => {
    cleanup();
    apiRequestMock.mockReset();
  });

  it("encontra uma conta pelo valor em formato brasileiro", async () => {
    const user = userEvent.setup();
    render(<AccountsTable />);

    await screen.findByText("Conta de energia");
    const search = screen.getByRole("searchbox", { name: "Buscar contas" });
    await user.type(search, "185,90");
    expect(screen.getByText("Conta de energia")).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "999,00");
    expect(screen.getByText("Nenhuma conta encontrada")).toBeInTheDocument();
  });

  it("edita e exclui uma conta a partir das ações da tabela", async () => {
    const user = userEvent.setup();
    render(<AccountsTable />);

    await user.click(await screen.findByRole("button", { name: "Editar Conta de energia" }));
    const description = screen.getByRole("textbox", { name: /Descrição/ });
    await user.clear(description);
    await user.type(description, "Conta de luz");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => expect(apiRequestMock).toHaveBeenCalledWith(
      "/api/financial-entries/conta-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ lugar: "Conta de luz", valor: 185.9, mesReferencia: "2026-08", tipo: "SAIDA" }),
      }),
    ));
    expect(await screen.findByText("Conta atualizada com sucesso.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Excluir Conta de luz" }));
    await user.click(screen.getByRole("button", { name: "Sim, excluir" }));

    await waitFor(() => expect(apiRequestMock).toHaveBeenCalledWith(
      "/api/financial-entries/conta-1",
      { method: "DELETE" },
    ));
    expect(await screen.findByText("Conta excluída com sucesso.")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma conta cadastrada")).toBeInTheDocument();
  });
});
