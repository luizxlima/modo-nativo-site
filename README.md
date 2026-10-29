# Modo Nativo — site completo

Site estático em HTML, CSS e JavaScript. Inclui imagens, comentários em loop e iluminação laranja que acompanha o mouse em toda a página.

## GitHub e Vercel

1. Extraia este ZIP.
2. Envie o conteúdo extraído para a raiz do seu repositório no GitHub. O index.html deve ficar na raiz.
3. Importe o repositório na Vercel como um projeto estático (preset Other).
4. Use a raiz do repositório como Root Directory. Não há dependências para instalar nem comando de build. Se for necessário indicar o diretório de saída, use `.`.
5. Publique o projeto.

## Arquivos

- index.html: conteúdo, preços e link do checkout.
- style.css: layout, cores, animações e efeito de luz.
- app.js: interações, áudio demonstrativo, loop de comentários e cursor.
- assets/: imagens locais necessárias ao site.

## Prévia local

Abra index.html no navegador ou rode `python3 -m http.server 8000` nesta pasta e acesse http://localhost:8000.

## Observações

- A versão exportada corresponde à publicação com o efeito de luz no site inteiro.
- Os três comentários adicionais continuam identificados como exemplos ilustrativos, para substituir por relatos reais antes de usá-los como depoimentos.
- O checkout e os valores foram mantidos conforme a página criada. Confira sua oferta antes de divulgar.
- As fontes usam Google Fonts; existe fonte alternativa caso o serviço não carregue.
- O áudio de exemplo usa a síntese de voz do navegador, quando disponível.
- Não inclui configuração de Pixel, GA4 ou formulário de captura.
