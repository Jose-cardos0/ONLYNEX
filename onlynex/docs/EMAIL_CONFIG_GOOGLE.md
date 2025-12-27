Configurar envio de email (opcional):
Para ativar o envio de emails, você precisa configurar as variáveis de ambiente no Google Cloud:
Acesse: https://console.cloud.google.com/functions/list?project=onlynex-7d640
Clique na função frendzWebhook
Clique em Editar
Vá em Variáveis de ambiente de tempo de execução
Adicione:
EMAIL_USER = seu-email@gmail.com
EMAIL_PASS = App Password do Gmail
⚠️ Importante sobre Gmail:
Para usar Gmail, você precisa criar uma App Password:
Acesse: https://myaccount.google.com/apppasswords
Crie uma senha de app para "Email"
Use essa senha (não a senha normal do Gmail)
Me diz o que aparece nos logs! 🔍
=========================================

Perfeito! 🎉 O webhook está funcionando! O usuário foi criado corretamente.
O email não foi enviado porque as variáveis de ambiente de email não estão configuradas. Vamos configurar:
📧 Configurar Envio de Email
Passo 1: Criar App Password no Gmail
Acesse: https://myaccount.google.com/apppasswords
Faça login com sua conta Gmail
Em "Selecionar app", escolha Outro e digite "OnlyNex"
Clique em Gerar
Copie a senha de 16 caracteres (ex: abcd efgh ijkl mnop)
Passo 2: Adicionar variáveis na Cloud Function
Acesse: https://console.cloud.google.com/functions/list?project=onlynex-7d640
Clique na função frendzWebhook
Clique em EDITAR (no topo)
Role até Variáveis de ambiente de tempo de execução
Clique em + ADICIONAR VARIÁVEL e adicione:
Nome Valor
EMAIL_USER seu-email@gmail.com
EMAIL_PASS abcdefghijklmnop (a App Password sem espaços)
Clique em PRÓXIMA → IMPLANTAR
Passo 3: Testar novamente
Faça outra compra teste e o email deve chegar! 📬
Alternativa rápida: Se não quiser configurar email agora, você pode enviar as credenciais manualmente ou por WhatsApp. O importante é que o sistema de criação de conta está funcionando! ✅
