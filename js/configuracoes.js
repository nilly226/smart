import { supabase } from "../supabase.js";

let idiomaAtual = "Português";
let configuracaoAtual = null;
let utilizadorAtual = null;

document.addEventListener("DOMContentLoaded", iniciarConfiguracoes);

async function iniciarConfiguracoes() {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session?.user) {
        window.location.replace("login.html");
        return;
    }

    utilizadorAtual = session.user;

    document.getElementById("idiomaBtn")?.addEventListener("click", escolherIdioma);
    document.getElementById("moedaBtn")?.addEventListener("click", escolherMoeda);
    document.getElementById("stockToggle")?.addEventListener("change", alterarStock);
    document.getElementById("logoutConfig")?.addEventListener("click", logout);
    
    document.getElementById("perfilNegocioBtn")?.addEventListener("click", () => {
        window.location.href = "perfil-negocio.html";
    });

    const configuracao = await obterConfiguracoes(utilizadorAtual);

    if (!configuracao) return;

    configuracaoAtual = configuracao;
    idiomaAtual = configuracao.idioma === "English" ? "English" : "Português";

    aplicarPreferencias(configuracao);
    verificarAdministrador();
    verificarAcessoSuporte();
}

async function verificarAdministrador() {
    const { data, error } = await supabase.rpc("verificar_se_e_admin");

    if (error) {
        console.error("Erro ao verificar administrador:", error);
        return;
    }

    const painelAdminBtn = document.getElementById("painelAdminBtn");

    if (painelAdminBtn && data === true) {
        painelAdminBtn.style.display = "flex";
        painelAdminBtn.addEventListener("click", () => {
            window.location.href = "admin.html";
        });
    }
}

async function verificarAcessoSuporte() {
    const { data, error } = await supabase
        .from("equipa_suporte")
        .select("ativo")
        .eq("user_id", utilizadorAtual.id)
        .eq("ativo", true)
        .maybeSingle();

    if (!error && data) {
        const painelSuporteBtn = document.getElementById("painelSuporteBtn");
        if (painelSuporteBtn) {
            painelSuporteBtn.style.display = "flex";
            painelSuporteBtn.addEventListener("click", () => {
                window.location.href = "suporte.html";
            });
        }
    }
}

async function obterConfiguracoes(user) {
    const { data, error } = await supabase
        .from("configuracoes")
        .select("idioma, moeda, stock_ativo")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
        console.error("Erro ao carregar configurações:", error);
        return null;
    }

    if (data) return data;

    const novaConfiguracao = {
        user_id: user.id,
        idioma: "Português",
        moeda: "MZN",
        stock_ativo: false
    };

    const { data: criada, error: erroCriacao } = await supabase
        .from("configuracoes")
        .insert(novaConfiguracao)
        .select("idioma, moeda, stock_ativo")
        .single();

    if (erroCriacao) {
        console.error("Erro ao criar configurações:", erroCriacao);
        return null;
    }

    return criada;
}

function aplicarPreferencias(configuracao) {
    document.documentElement.lang = idiomaAtual === "English" ? "en" : "pt";

    const idiomaElemento = document.getElementById("idiomaAtual");
    const moedaElemento = document.getElementById("moedaAtual");
    const stockToggle = document.getElementById("stockToggle");

    if (idiomaElemento) idiomaElemento.textContent = idiomaAtual;
    if (moedaElemento) moedaElemento.textContent = obterNomeMoeda(configuracao.moeda);
    if (stockToggle) stockToggle.checked = configuracao.stock_ativo === true;

    aplicarIdioma();
    atualizarTextoStock(configuracao.stock_ativo === true);
}

function atualizarTextoStock(ativado) {
    const stockElemento = document.getElementById("stockAtual");
    if (!stockElemento) return;

    stockElemento.textContent = idiomaAtual === "English"
        ? ativado ? "Disable" : "Enable"
        : ativado ? "Desativar" : "Ativar";
}

function aplicarIdioma() {
    const ingles = idiomaAtual === "English";

    document.title = ingles ? "Settings - Smart Luny" : "Configurações - Smart Luny";

    const textos = {
        tituloConfiguracoes: ingles ? "Settings" : "Configurações",
        descricaoConfiguracoes: ingles ? "Customize Smart Luny according to your needs." : "Personalize o Smart Luny de acordo com as suas necessidades.",
        tituloPerfilNegocio: ingles ? "Business Profile" : "Perfil do negócio",
        descricaoPerfilNegocio: ingles ? "Business name and activity" : "Nome e actividade do seu negócio",
        tituloIdioma: ingles ? "Language" : "Idioma",
        tituloMoeda: ingles ? "Currency" : "Moeda",
        tituloStock: ingles ? "Stock Control" : "Controlo de Stock",
        tituloFeedback: ingles ? "Send Feedback" : "Enviar Feedback",
        descricaoFeedback: ingles ? "Share your suggestions or comments with us." : "Partilhe connosco as suas sugestões ou comentários.",
        tituloPainelAdmin: ingles ? "Administration Panel" : "Painel de Administração",
        descricaoPainelAdmin: ingles ? "Monitor Smart Luny data and usage." : "Acompanhe os dados e a utilização do Smart Luny.",
        textoLogout: ingles ? "Log Out" : "Terminar Sessão",
        footerNome: "Smart Luny © 2026",
        footerVersao: ingles ? "Version 1.0" : "Versão 1.0"
    };

    Object.entries(textos).forEach(([id, texto]) => {
        const elemento = document.getElementById(id);
        if (elemento) elemento.textContent = texto;
    });

    const menus = {
        menuInicio: ingles ? "Home" : "Início",
        menuTransacoes: ingles ? "Transactions" : "Transações",
        menuItens: ingles ? "Items" : "Itens",
        menuHistorico: ingles ? "History" : "Histórico",
        menuConfiguracoes: ingles ? "Settings" : "Configurações"
    };

    Object.entries(menus).forEach(([id, texto]) => {
        const elemento = document.getElementById(id);
        if (!elemento) return;

        if (elemento.tagName === "A") {
            const span = elemento.querySelector("span");
            if (span) span.textContent = texto;
            elemento.title = texto;
            return;
        }

        elemento.textContent = texto;
    });

    const textarea = document.getElementById("sugestao");
    if (textarea) {
        textarea.placeholder = ingles ? "Tell us about your experience, opinion, difficulty or idea..." : "Conte-nos a sua experiência, opinião, dificuldade ou ideia...";
    }

    atualizarTextoStock(document.getElementById("stockToggle")?.checked === true);

    const moedaElemento = document.getElementById("moedaAtual");
    if (moedaElemento && configuracaoAtual) {
        moedaElemento.textContent = obterNomeMoeda(configuracaoAtual.moeda);
    }
}

async function escolherIdioma() {
    if (!utilizadorAtual || !configuracaoAtual) return;

    const novoIdioma = idiomaAtual === "English" ? "Português" : "English";
    const botao = document.getElementById("idiomaBtn");

    if (botao) botao.disabled = true;

    const { data, error } = await supabase
        .from("configuracoes")
        .update({ idioma: novoIdioma, updated_at: new Date().toISOString() })
        .eq("user_id", utilizadorAtual.id)
        .select("idioma, moeda, stock_ativo")
        .single();

    if (error) {
        console.error("Erro ao actualizar idioma:", error);
        if (botao) botao.disabled = false;
        alert(idiomaAtual === "English" ? "Unable to update language." : "Não foi possível actualizar o idioma.");
        return;
    }

    configuracaoAtual = data;
    idiomaAtual = data.idioma === "English" ? "English" : "Português";

    aplicarPreferencias(configuracaoAtual);

    if (botao) botao.disabled = false;

    window.dispatchEvent(new CustomEvent("idiomaAlterado", { detail: { idioma: idiomaAtual } }));
}

async function escolherMoeda() {
    if (!utilizadorAtual || !configuracaoAtual) return;

    const moedas = ["MZN", "USD", "EUR", "BRL"];
    const indiceAtual = moedas.indexOf(configuracaoAtual.moeda);
    const proximaMoeda = moedas[(indiceAtual + 1) % moedas.length];

    const { data, error } = await supabase
        .from("configuracoes")
        .update({ moeda: proximaMoeda, updated_at: new Date().toISOString() })
        .eq("user_id", utilizadorAtual.id)
        .select("idioma, moeda, stock_ativo")
        .single();

    if (error) {
        console.error("Erro ao actualizar moeda:", error);
        alert(idiomaAtual === "English" ? "Unable to update currency." : "Não foi possível actualizar a moeda.");
        return;
    }

    configuracaoAtual = data;

    const moedaElemento = document.getElementById("moedaAtual");
    if (moedaElemento) moedaElemento.textContent = obterNomeMoeda(data.moeda);

    window.dispatchEvent(new CustomEvent("moedaAlterada", { detail: { moeda: data.moeda } }));
}

async function alterarStock(event) {
    if (!utilizadorAtual) return;

    const stockToggle = event.target;
    const novoEstado = stockToggle.checked === true;
    const estadoAnterior = !novoEstado;

    atualizarTextoStock(novoEstado);
    stockToggle.disabled = true;

    const { data, error } = await supabase
        .from("configuracoes")
        .update({ stock_ativo: novoEstado, updated_at: new Date().toISOString() })
        .eq("user_id", utilizadorAtual.id)
        .select("idioma, moeda, stock_ativo")
        .single();

    stockToggle.disabled = false;

    if (error) {
        console.error("Erro ao actualizar stock:", error);
        stockToggle.checked = estadoAnterior;
        atualizarTextoStock(estadoAnterior);
        alert(idiomaAtual === "English" ? "Unable to update stock control." : "Não foi possível actualizar o controlo de stock.");
        return;
    }

    configuracaoAtual = data;
    atualizarTextoStock(data.stock_ativo === true);

    window.dispatchEvent(new CustomEvent("stockAlterado", { detail: { ativado: data.stock_ativo } }));
}

function obterNomeMoeda(moeda) {
    const nomes = idiomaAtual === "English"
        ? { MZN: "Metical (MT)", USD: "Dollar (USD)", EUR: "Euro (EUR)", BRL: "Brazilian Real (BRL)" }
        : { MZN: "Metical (MT)", USD: "Dólar (USD)", EUR: "Euro (EUR)", BRL: "Real brasileiro (R$)" };

    return nomes[moeda] || nomes.MZN;
}

async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error("Erro ao terminar sessão:", error);
        alert(idiomaAtual === "English" ? "Unable to log out." : "Não foi possível terminar sessão.");
        return;
    }

    window.location.replace("login.html");
}