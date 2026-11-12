import { supabase } from "../supabase.js";

console.log("convite.js carregado");

const mensagem =
    document.getElementById("mensagem");

const botaoAceitar =
    document.getElementById("aceitarConvite");

const parametros =
    new URLSearchParams(
        window.location.search
    );

const token =
    parametros.get("token");

console.log(
    "URL atual:",
    window.location.href
);

console.log(
    "Token recebido:",
    token
);

if (!mensagem || !botaoAceitar) {
    console.error(
        "Elementos mensagem ou aceitarConvite não encontrados."
    );
} else if (!token) {
    mensagem.textContent =
        "Convite inválido: token não encontrado.";
} else {
    carregarConvite();
}

async function carregarConvite() {
    mensagem.textContent =
        "A verificar convite...";

    console.log(
        "A procurar convite com o token:",
        token
    );

    const {
        data: convite,
        error
    } = await supabase
        .from("convites_empresa")
        .select(
            "id, empresa_id, funcao, status"
        )
        .eq("token", token)
        .maybeSingle();

    console.log(
        "Resultado da consulta do convite:",
        {
            convite,
            error
        }
    );

    if (error) {
        console.error(
            "Erro ao carregar convite:",
            error
        );

        mensagem.textContent =
            "Erro ao carregar o convite: " +
            error.message;

        return;
    }

    if (!convite) {
        mensagem.textContent =
            "Este convite não existe ou o token está incorreto.";

        return;
    }

    if (convite.status !== "pendente") {
        mensagem.textContent =
            "Este convite já foi utilizado ou não está pendente.";

        return;
    }

    const {
        data: empresa,
        error: erroEmpresa
    } = await supabase
        .from("perfis")
        .select("nome_empresa")
        .eq("id", convite.empresa_id)
        .maybeSingle();

    console.log(
        "Resultado da consulta da empresa:",
        {
            empresa,
            erroEmpresa
        }
    );

    if (erroEmpresa) {
        console.error(
            "Erro ao carregar empresa:",
            erroEmpresa
        );

        mensagem.textContent =
            "O convite existe, mas não foi possível carregar os dados da empresa.";

        return;
    }

    const nomeEmpresa =
        empresa?.nome_empresa ||
        "empresa";

    const funcao =
        convite.funcao ||
        "responsável";

    mensagem.textContent =
        `Recebeste um convite para integrar a empresa ${nomeEmpresa} como ${funcao}. Ao aceitar, terás acesso para colaborar na gestão do negócio.`;

    botaoAceitar.style.display =
        "block";

    botaoAceitar.disabled =
        false;

    botaoAceitar.onclick =
        () => aceitarConvite(convite);
}

async function aceitarConvite(convite) {
    botaoAceitar.disabled =
        true;

    botaoAceitar.textContent =
        "A aceitar...";

    const {
        data: {
            user
        },
        error: erroAuth
    } = await supabase.auth.getUser();

    console.log(
        "Utilizador autenticado:",
        user
    );

    if (erroAuth || !user) {
        const redirect =
            encodeURIComponent(
                window.location.href
            );

        window.location.href =
            `login.html?redirect=${redirect}`;

        return;
    }

    const {
        data: membroExistente,
        error: erroVerificacao
    } = await supabase
        .from("membros_empresa")
        .select("id")
        .eq(
            "empresa_id",
            convite.empresa_id
        )
        .eq(
            "usuario_id",
            user.id
        )
        .maybeSingle();

    if (erroVerificacao) {
        console.error(
            "Erro ao verificar membro existente:",
            erroVerificacao
        );

        mensagem.textContent =
            "Não foi possível verificar se já pertences à empresa.";

        botaoAceitar.disabled =
            false;

        botaoAceitar.textContent =
            "Aceitar convite";

        return;
    }

    if (membroExistente) {
        mensagem.textContent =
            "Já fazes parte desta empresa.";

        botaoAceitar.disabled =
            true;

        return;
    }

    const {
        error: erroMembro
    } = await supabase
        .from("membros_empresa")
        .insert({
            empresa_id:
                convite.empresa_id,

            usuario_id:
                user.id,

            funcao:
                convite.funcao
        });

    if (erroMembro) {
        console.error(
            "Erro ao inserir membro:",
            erroMembro
        );

        mensagem.textContent =
            "Erro ao aceitar convite: " +
            erroMembro.message;

        botaoAceitar.disabled =
            false;

        botaoAceitar.textContent =
            "Aceitar convite";

        return;
    }

    const {
        error: erroAtualizacao
    } = await supabase
        .from("convites_empresa")
        .update({
            status: "aceite"
        })
        .eq(
            "id",
            convite.id
        )
        .eq(
            "status",
            "pendente"
        );

    if (erroAtualizacao) {
        console.error(
            "Erro ao atualizar estado do convite:",
            erroAtualizacao
        );

        mensagem.textContent =
            "O membro foi adicionado, mas o estado do convite não foi atualizado.";

        return;
    }

    mensagem.textContent =
        "Convite aceite com sucesso!";

    botaoAceitar.style.display =
        "none";

    setTimeout(() => {
        window.location.href =
            "inicio.html";
    }, 1200);
}