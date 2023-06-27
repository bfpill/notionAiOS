# notionAiOS Plugin for ChatGPT

This plugin allows ChatGPT to generate entire coding projects for you with a single prompt. The plugin uses Notion as a filesystem while it is building the projects, allowing the user to observe the projects structure and code as it is getting generated. Once the user is happy with the project, they can ask chatGPT for a download link, and can download the actual project in a zip file, ready to be opened in their code editor for further changes.

This is great for generating initial project structure / boilerplate / and actual code to get a project kickstarted. 

## Download Link Generation

The download link for a project is generated using Firebase Cloud Functions. When a request is made to download a project, a cloud function is triggered to create a zip of the project. The function takes the generated project structure and creates the relevant files on the cloud before creating the zip. This zip file is then stored in Firebase Cloud Storage, and a URL to download the file is generated. Currently links are not signed but they will be in the future. 

This URL is then returned by the cloud function and can be used to download the project zip file.

## Running the Plugin

After forking the plugin repository, do a quick yarn install and then yarn run dev to get the server up and running. This starts the plugin's server on your local machine.

You also need to link the localhost server to the GPT plugins. This allows the GPT model to interact with the plugin and perform actions like creating pages, adding blocks, and generating download links.

Please note that you need to have the necessary permissions and configurations set up in your Notion and Firebase accounts to use this plugin. Add a .env file and include in it: 

```
NOTION_TOKEN="secret_...."
NOTION_DATABASE_ID="...." 
FIREBASE_API_KEY="...."
```

Later down the road there will be some sort of Auth when you first add the plugin where you provide the notion database ID. 
