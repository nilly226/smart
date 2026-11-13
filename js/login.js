import { supabase } from "../supabase.js";
import { initGoogleAuth } from "./google-auth.js";

const params = new URLSearchParams(window.location.search);
const veioDeAlteracaoSenha = params.get("senha_alterada") === "1";

if (veioDeAlteracaoSenha) {
    window.history.replaceState({}, document.title, "login.html");
}

async function associarVisitasAoUtilizador(user) {
    try {
        const identificadorVisitante = localStorage.getItem("smart_luny_visitante_registo");
        if (!identificadorVisitante || !user?.id) return;

        const { error } = await supabase
            .from("visitas")
            .update({ utilizador_id: user.id })
            .eq("identificador_visitante", identificadorVisitante)
            .is("utilizador_id", null);

        if (error) {
            console.error("Erro ao associar visitas:", error);
            return;
        }
        localStorage.removeItem("smart_luny_visitante_registo");
    } catch (error) {
        console.error("Erro inesperado ao associar visitas:", error);
    }
}

async function login() {
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;

    if (!email || !senha) {
        alert("Preencha todos os campos.");
        return;
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: senha
        });

        if (error) throw error;

        const user = data?.user;
        if (!user) throw new Error("Não foi possível identificar o utilizador.");

        // ========================================================
        // VERIFICAÇÃO DE AGENTE DE SUPORTE AQUI
        // ========================================================
        const { data: equipa } = await supabase
            .from("equipa_suporte")
            .select("ativo")
            .eq("user_id", user.id)
            .eq("ativo", true)
            .maybeSingle();

        if (equipa) {
            // Se for agente, vai direto para o painel de suporte
            window.location.replace("suporte.html");
            return;
        }
        // ========================================================

        await associarVisitasAoUtilizador(user);

        const { data: perfil, error: perfilError } = await supabase
            .from("perfis")
            .select("nome_empresa, atividade_negocio")
            .eq("user_id", user.id)
            .maybeSingle();

        if (perfilError) {
            console.error("Erro ao verificar perfil:", perfilError);
            alert("Não foi possível verificar os dados do negócio.");
            return;
        }

        if (!perfil) {
            window.location.replace("meu-negocio.html");
            return;
        }

        if (!perfil.nome_empresa) {
            window.location.replace("meu-negocio.html");
            return;
        }

        if (!perfil.atividade_negocio) {
            window.location.replace("actividade.html");
            return;
        }

        window.location.replace("inicio.html");

    } catch (error) {
        console.error("Erro ao fazer login:", error);

        if (error?.message?.toLowerCase().includes("email not confirmed")) {
            alert("Por favor, confirme o seu email antes de entrar.");
            return;
        }

        alert("Erro ao fazer login: " + (error?.message || "Não foi possível entrar."));
    }
}

window.login = login;

const botaoMostrarSenha = document.getElementById("mostrarSenha");

if (botaoMostrarSenha) {
    botaoMostrarSenha.addEventListener("click", () => {
        const campoSenha = document.getElementById("senha");
        const icone = botaoMostrarSenha.querySelector("i");
        const mostrar = campoSenha.type === "password";

        campoSenha.type = mostrar ? "text" : "password";

        botaoMostrarSenha.setAttribute("aria-pressed", String(mostrar));
        botaoMostrarSenha.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");

        icone.className = mostrar ? "fa-regular fa-eye" : "fa-regular fa-eye-slash";
    });
}

initGoogleAuth("google-login");