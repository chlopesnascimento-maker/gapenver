import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import "./CidadaosdoReino.css";

function CidadaosdoReino({ navigateTo, user }) {
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PROFILES_PER_PAGE = 10;
  
  // MUDANÇA CRÍTICA 1: Criamos uma variável clara para saber se o usuário está logado.
  const isUserLoggedIn = user?.id;

  useEffect(() => {
    const fetchCitizens = async () => {
      setLoading(true);

      const from = (page - 1) * PROFILES_PER_PAGE;
      const to = from + PROFILES_PER_PAGE - 1;

      let query = supabase
        .from("profiles")
        .select("id, nome, sobrenome, foto_url, cargo, reino", { count: 'exact' });

      // MUDANÇA CRÍTICA 2: Usamos nossa nova variável para a lógica.
      if (isUserLoggedIn) {
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error("Erro ao buscar cidadãos:", error);
        setCitizens([]);
      } else {
        setCitizens(data || []);
        if (isUserLoggedIn) {
          setTotalPages(Math.ceil(count / PROFILES_PER_PAGE));
        }
      }
      setLoading(false);
    };

    fetchCitizens();
  }, [page, isUserLoggedIn]); // A busca agora também reage à mudança de login/logout

  const filteredCitizens = citizens.filter((citizen) =>
    `${citizen.nome} ${citizen.sobrenome}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );
  
  // MUDANÇA CRÍTICA 3: A lógica do teaser agora funciona com a variável correta.
  const profilesParaMostrar = isUserLoggedIn ? filteredCitizens : filteredCitizens.slice(0, 3);
  const teaserProfile = !isUserLoggedIn && filteredCitizens.length > 3 ? filteredCitizens[3] : null;

  if (loading) {
    return (
      <div className="citizens-container">
        <p>Carregando cidadãos...</p>
      </div>
    );
  }

  return (
    <div className="citizens-container">
      <h2>Cidadãos do Reino</h2>
      <p>Conheça todos os membros do nosso reino:</p>
      
      {/* A caixa de busca só aparece para usuários logados */}
      {isUserLoggedIn && (
        <div className="search-box">
          <img 
            src="https://cdn-icons-png.flaticon.com/256/1436/1436612.png" 
            alt="Pesquisar" 
            className="search-icon"
          />
          <input
            type="text"
            placeholder="Pesquisar cidadão"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      <div className="citizens-grid">
        {profilesParaMostrar.map((citizen) => (
          <div
            key={citizen.id}
            className="citizen-card"
            onClick={() => navigateTo("userProfile", { userId: citizen.id })}
          >
            <img
              src={citizen.foto_url || "https://i.imgur.com/ZUQJmco.png"}
              alt={`${citizen.nome} ${citizen.sobrenome}`}
              className="citizen-photo"
            />
            <div className="citizen-info">
              <h3>{citizen.nome} {citizen.sobrenome}</h3>
              <span className={`citizen-role role-${citizen.cargo?.toLowerCase() || "default"}`}>
                {citizen.cargo || "Membro"}
              </span>
              <p className="citizen-reino">{citizen.reino || "Reino não declarado"}</p>
            </div>
          </div>
        ))}

        {/* O CARD "EMBAÇADO" PARA VISITANTES */}
        {teaserProfile && (
          <div className="teaser-fade" onClick={() => navigateTo('register')}>
            <div className="citizen-card">
              <img src={teaserProfile.foto_url || "https://i.imgur.com/ZUQJmco.png"} alt={`${teaserProfile.nome} ${teaserProfile.sobrenome}`} className="citizen-photo"/>
              <div className="citizen-info">
                <h3>{teaserProfile.nome} {teaserProfile.sobrenome}</h3>
                <span className={`citizen-role role-${teaserProfile.cargo?.toLowerCase() || "default"}`}>
                  {teaserProfile.cargo || "Membro"}
                </span>
                <p className="citizen-reino">{teaserProfile.reino || "Reino não declarado"}</p>
              </div>
            </div>
            <div className="cta-overlay">
              <h3>E muitos outros!</h3>
              <p>Para ver a lista completa, cadastre-se ou faça login no Reino.</p>
            </div>
          </div>
        )}
      </div>
      
      {/* CONTROLES DE PAGINAÇÃO PARA LOGADOS */}
      {isUserLoggedIn && totalPages > 1 && (
        <div className="pagination-controls">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
            <button 
              key={pageNumber} 
              onClick={() => setPage(pageNumber)}
              className={page === pageNumber ? 'active' : ''}
            >
              {pageNumber}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default CidadaosdoReino;