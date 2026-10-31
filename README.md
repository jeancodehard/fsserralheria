# FS Serralheria — site

Site institucional estático da FS Serralheria, de Campos Novos–SC. Feito em HTML, CSS e JavaScript puro: sem build, sem banco de dados e sem dependências externas em tempo de execução.

## Estrutura

```
fsserralheria/
├─ site/                  → esta pasta é a que vai para o ar
│  ├─ index.html
│  ├─ css/styles.css
│  ├─ js/main.js
│  ├─ fonts/              → Barlow e Barlow Condensed (subset latino, .woff2)
│  ├─ assets/
│  │  ├─ fotos/           → derivados .webp em vários tamanhos
│  │  ├─ logo/            → logo original e versão negativa
│  │  ├─ icone/           → favicons e ícone de app
│  │  ├─ og-image.jpg
│  │  └─ ruido.png
│  ├─ .nojekyll           → impede o processamento pelo Jekyll no Pages
│  ├─ robots.txt
│  └─ site.webmanifest
├─ originais/             → fotos originais e fontes da logo/favicon (não publicadas)
└─ plano.md               → briefing do projeto
```

## Rodar localmente

Na pasta `site/`:

```bash
python -m http.server 4173
```

Depois abra `http://localhost:4173/`. Também funciona com `npx serve .` ou qualquer servidor estático.

## Publicar no GitHub Pages

### Opção A — repositório dedicado (recomendado)

1. Crie um repositório no GitHub.
2. Copie **o conteúdo de `site/`** para a raiz do repositório (o `index.html` precisa ficar na raiz).
3. Faça commit e envie para o branch `main`.
4. No repositório: **Settings → Pages → Build and deployment → Deploy from a branch**.
5. Selecione `main` e `/ (root)` e salve.

O site fica disponível em `https://USUARIO.github.io/REPOSITORIO/`.

### Opção B — publicar a subpasta deste repositório

Se este repositório continuar com vários projetos, use um workflow de GitHub Actions que envie apenas `fsserralheria/site` como artefato do Pages. Nesse caso, o caminho publicado será uma subpasta (`https://USUARIO.github.io/REPOSITORIO/`), e os links relativos do site continuam funcionando.

## Antes de publicar

- **Domínio e compartilhamento:** o `og:image` está com caminho relativo. Depois de definir o endereço final, troque por uma URL absoluta, por exemplo:
  `https://USUARIO.github.io/REPOSITORIO/assets/og-image.jpg`.
  Se houver domínio próprio, vale acrescentar também `<link rel="canonical" href="...">` no `<head>`.
- **WhatsApp:** todos os links usam `5549999145068` e uma mensagem curta pré-preenchida. Se o número mudar, faça uma busca por esse valor em `site/index.html`.
- **Mapa:** o link “Abrir no Google Maps” usa o endereço da oficina. Confirme o ponto antes de divulgar.
- **Fotos:** os arquivos em `site/assets/fotos/` são derivados WebP; os originais estão em `originais/`. Para trocar uma foto, gere os mesmos tamanhos e atualize `srcset`/`sizes` no HTML.
- **Conteúdo:** o site não informa preços, anos de experiência nem quantidade de clientes. Mantenha essa regra ao editar os textos.

## Checklist rápido

- [ ] Abrir o menu mobile, navegar pelos links e fechar com Esc.
- [ ] Abrir cada foto da galeria e navegar com as setas.
- [ ] Testar os botões de WhatsApp no celular.
- [ ] Testar o link do Google Maps.
- [ ] Conferir o site em 360 px, 390 px, tablet e desktop.
- [ ] Rodar o Lighthouse depois da publicação.

## Acessibilidade e movimento

- Navegação por teclado com foco visível, link “Pular para o conteúdo” e menu com o restante da página inerte enquanto aberto.
- `prefers-reduced-motion`: as faíscas do hero viram uma composição estática e as animações de entrada são desativadas.
- Imagens com texto alternativo e lightbox com `<dialog>` nativo.
