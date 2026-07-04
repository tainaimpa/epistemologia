Projeto final de visualização para a disciplina de Epstemologia da Ciência pelo IMPA Tech.

**Professor:** Rafael Beraldo

**Integrantes do grupo:** Pedro Porto, Pedro Santos, Pedro Alberti, Suelen Veiga, Tainá Drumond, Yasmin Monteiro

## Como rodar

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

Acesse http://localhost:5000

## Estrutura do projeto

```
app.py                        # servidor Flask
data/
  loader.py                   # parseia CSV + JSON dos filósofos para a API
  theories_meta.json          # metadados das teorias (ex: "desde quando")
  teorias_filosofos.csv       # dados brutos: veredito/justificativa de cada filósofo por teoria
  philosophers/                # um arquivo por filósofo (nome, cor, critério, bio)
    popper.json
    kuhn.json
    ...
templates/
  index.html                  # página base
  partials/
    topbar.html                # barra superior com os botões dos filósofos
    sidebar.html                # legenda lateral
    phil_card.html              # template reutilizável da "caixinha" de cada filósofo
static/
  css/                         # variáveis, base, layout, componentes, responsividade
  js/                          # estado global, tema, sidebar, filósofos, gráfico D3, fetch de dados
```

## Adicionando/editando um filósofo

Crie ou edite um arquivo em `data/philosophers/<nome>.json` com os campos
`key`, `csv_prefix` (prefixo das colunas no CSV), `order`, `name`, `full_name`,
`color`, `criterion` e `bio`. Cada filósofo fica em seu próprio arquivo
justamente para evitar conflitos de merge quando várias pessoas editam ao
mesmo tempo.
