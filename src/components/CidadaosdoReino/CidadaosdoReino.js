import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import "./CidadaosdoReino.css";

function CidadaosdoReino({ navigateTo, user }) {

  // -----------------------------
  // MAPA DE CARGOS FICTÍCIOS
  // -----------------------------
  const cargoFicticioMap = {
    admin: { name: "Administrador", color: "#e74c3c", fontWeight: "bold" },
    viajante: { name: "Viajante", color: "#3498db", fontWeight: "bold" },
    oficialreal: { name: "Luminir", color: "#f39c12", fontWeight: "bold" },
    guardareal: { name: "Mehalkir Almastri", color: "#2ecc71", fontWeight: "bold" },
  };

  const getCargoFicticio = (cargoReal) => {
    return (
      cargoFicticioMap[cargoReal] || {
        name: cargoReal || "Membro",
        color: "#ffffff",
        fontWeight: "normal",
      }
    );
  };

  // -----------------------------
  // ESTADOS
  // -----------------------------
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PROFILES_PER_PAGE = 10;
  
  const isUserLoggedIn = user?.id;

  // -----------------------------
  // FETCH DOS CIDADÃOS
  // -----------------------------
  useEffect(() => {
    const fetchCitizens = async () => {
      setLoading(true);

      const from = (page - 1) * PROFILES_PER_PAGE;
      const to = from + PROFILES_PER_PAGE - 1;

      let query = supabase
        .from("profiles")
        .select("id, nome, sobrenome, foto_url, cargo, reino", { count: 'exact' });

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
  }, [page, isUserLoggedIn]);

  // -----------------------------
  // FILTRO DE BUSCA
  // -----------------------------
  const filteredCitizens = citizens.filter((citizen) =>
    `${citizen.nome} ${citizen.sobrenome}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const profilesParaMostrar = isUserLoggedIn
    ? filteredCitizens
    : filteredCitizens.slice(0, 3);

  const teaserProfile =
    !isUserLoggedIn && filteredCitizens.length > 3
      ? filteredCitizens[3]
      : null;

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
     {profilesParaMostrar.map((citizen) => {
  
  const cargo = citizen.cargo?.toLowerCase() || "default";

  // STAFF ROLES
  const isStaff = ["admin", "oficialreal", "guardareal", "autor"].includes(cargo);

  // BADGE ICONS
  let badge = "";
if (cargo === "admin")        badge = "✦";
if (cargo === "oficialreal")  badge = "☼";
if (cargo === "guardareal")   badge = "⚚";
if (cargo === "autor")        badge = "✒";


  return (
    <div
      key={citizen.id}
      className={`citizen-card ${isStaff ? "staff" : ""}`}
      onClick={() => navigateTo("userProfile", { userId: citizen.id })}
    >
      {/* BADGE */}
     {isStaff && (
  <div className={`staff-runa staff-runa-${cargo}`}>
    {badge}
  </div>
)}


      <img
        src={citizen.foto_url || "https://i.imgur.com/ZUQJmco.png"}
        alt={`${citizen.nome} ${citizen.sobrenome}`}
        className="citizen-photo"
      />

      <div className="citizen-info">
        <h3>{citizen.nome} {citizen.sobrenome}</h3>

        <span
  className={`citizen-role role-${cargo}`}
  style={{
    fontWeight: getCargoFicticio(cargo).fontWeight
  }}
>
  {getCargoFicticio(cargo).name}
</span>


        <p className="citizen-reino">{citizen.reino || "Reino não declarado"}</p>
      </div>
    </div>
  );
})}


        {/* CARD TEASER (VISITANTE) */}
        {teaserProfile && (
          <div
            className="teaser-fade"
            onClick={() => navigateTo("register")}
          >
            <div className="citizen-card">
              <img
                src={teaserProfile.foto_url || "https://i.imgur.com/ZUQJmco.png"}
                alt={`${teaserProfile.nome} ${teaserProfile.sobrenome}`}
                className="citizen-photo"
              />
              <div className="citizen-info">
                <h3>{teaserProfile.nome} {teaserProfile.sobrenome}</h3>

                {/* CARGO FICTÍCIO NO TEASER TAMBÉM */}
                <span
                  className="citizen-role"
                  style={{
                    color: getCargoFicticio(teaserProfile.cargo).color,
                    fontWeight: getCargoFicticio(teaserProfile.cargo).fontWeight,
                  }}
                >
                  {getCargoFicticio(teaserProfile.cargo).name}
                </span>

                <p className="citizen-reino">
                  {teaserProfile.reino || "Reino não declarado"}
                </p>
              </div>
            </div>

            <div className="cta-overlay">
              <h3>E muitos outros!</h3>
              <p>Para ver a lista completa, cadastre-se ou faça login no Reino.</p>
            </div>
          </div>
        )}
      </div>
      
      {isUserLoggedIn && totalPages > 1 && (
        <div className="pagination-controls">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
            <button
              key={pageNumber}
              onClick={() => setPage(pageNumber)}
              className={page === pageNumber ? "active" : ""}
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
