import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, CheckCircle } from "lucide-react";
import Layout from "@/components/layout";

const codeExamples = {
  nodejs: {
    register: `const response = await fetch('https://bookmark-api.example.com/api/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'john_doe',
    email: 'john@example.com',
    password: 'securePassword123'
  })
});
const user = await response.json();
console.log(user);`,

    login: `const response = await fetch('https://bookmark-api.example.com/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // for session cookies
  body: JSON.stringify({
    username: 'john_doe',
    password: 'securePassword123'
  })
});
const user = await response.json();
console.log(user);`,

    listBookmarks: `const response = await fetch(
  'https://bookmark-api.example.com/api/bookmarks?page=1&limit=10',
  { 
    headers: {
      'Authorization': 'Bearer YOUR_API_TOKEN'
    }
  }
);
const data = await response.json();
console.log(data.items); // Array of bookmarks`,

    createBookmark: `const response = await fetch('https://bookmark-api.example.com/api/bookmarks', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_TOKEN'
  },
  body: JSON.stringify({
    title: 'My Bookmark',
    url: 'https://example.com',
    description: 'A great resource',
    isPublic: false
  })
});
const bookmark = await response.json();
console.log(bookmark);`,

    updateBookmark: `const id = 1;
const response = await fetch(\`https://bookmark-api.example.com/api/bookmarks/\${id}\`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_TOKEN'
  },
  body: JSON.stringify({
    title: 'Updated Title',
    isPublic: true
  })
});
const bookmark = await response.json();
console.log(bookmark);`,

    deleteBookmark: `const id = 1;
const response = await fetch(\`https://bookmark-api.example.com/api/bookmarks/\${id}\`, {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer YOUR_API_TOKEN'
  }
});
console.log('Deleted:', response.ok);`,

    createToken: `const response = await fetch('https://bookmark-api.example.com/api/tokens', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer EXISTING_TOKEN'
  },
  body: JSON.stringify({
    label: 'My App Token'
  })
});
const token = await response.json();
console.log(token.token); // Use this token for API calls`
  },

  python: {
    register: `import requests
import json

response = requests.post(
    'https://bookmark-api.example.com/api/register',
    headers={'Content-Type': 'application/json'},
    json={
        'username': 'john_doe',
        'email': 'john@example.com',
        'password': 'securePassword123'
    }
)
user = response.json()
print(user)`,

    login: `import requests

response = requests.post(
    'https://bookmark-api.example.com/api/login',
    headers={'Content-Type': 'application/json'},
    json={
        'username': 'john_doe',
        'password': 'securePassword123'
    }
)
user = response.json()
print(user)`,

    listBookmarks: `import requests

token = 'YOUR_API_TOKEN'
response = requests.get(
    'https://bookmark-api.example.com/api/bookmarks?page=1&limit=10',
    headers={'Authorization': f'Bearer {token}'}
)
data = response.json()
print(data['items'])`,

    createBookmark: `import requests

token = 'YOUR_API_TOKEN'
response = requests.post(
    'https://bookmark-api.example.com/api/bookmarks',
    headers={
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    },
    json={
        'title': 'My Bookmark',
        'url': 'https://example.com',
        'description': 'A great resource',
        'isPublic': False
    }
)
bookmark = response.json()
print(bookmark)`,

    updateBookmark: `import requests

token = 'YOUR_API_TOKEN'
bookmark_id = 1
response = requests.patch(
    f'https://bookmark-api.example.com/api/bookmarks/{bookmark_id}',
    headers={
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    },
    json={
        'title': 'Updated Title',
        'isPublic': True
    }
)
bookmark = response.json()
print(bookmark)`,

    deleteBookmark: `import requests

token = 'YOUR_API_TOKEN'
bookmark_id = 1
response = requests.delete(
    f'https://bookmark-api.example.com/api/bookmarks/{bookmark_id}',
    headers={'Authorization': f'Bearer {token}'}
)
print('Deleted:', response.ok)`,

    createToken: `import requests

token = 'YOUR_EXISTING_TOKEN'
response = requests.post(
    'https://bookmark-api.example.com/api/tokens',
    headers={
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    },
    json={'label': 'My App Token'}
)
api_token = response.json()
print(api_token['token'])`
  },

  go: {
    register: `package main

import (
    "bytes"
    "encoding/json"
    "io"
    "net/http"
)

type RegisterPayload struct {
    Username string \`json:"username"\`
    Email    string \`json:"email"\`
    Password string \`json:"password"\`
}

func main() {
    payload := RegisterPayload{
        Username: "john_doe",
        Email:    "john@example.com",
        Password: "securePassword123",
    }
    jsonData, _ := json.Marshal(payload)

    resp, _ := http.Post(
        "https://bookmark-api.example.com/api/register",
        "application/json",
        bytes.NewBuffer(jsonData),
    )
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    println(string(body))
}`,

    login: `package main

import (
    "bytes"
    "encoding/json"
    "io"
    "net/http"
)

type LoginPayload struct {
    Username string \`json:"username"\`
    Password string \`json:"password"\`
}

func main() {
    payload := LoginPayload{
        Username: "john_doe",
        Password: "securePassword123",
    }
    jsonData, _ := json.Marshal(payload)

    resp, _ := http.Post(
        "https://bookmark-api.example.com/api/login",
        "application/json",
        bytes.NewBuffer(jsonData),
    )
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    println(string(body))
}`,

    listBookmarks: `package main

import (
    "io"
    "net/http"
)

func main() {
    req, _ := http.NewRequest("GET",
        "https://bookmark-api.example.com/api/bookmarks?page=1&limit=10",
        nil)
    
    req.Header.Set("Authorization", "Bearer YOUR_API_TOKEN")
    
    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    
    body, _ := io.ReadAll(resp.Body)
    println(string(body))
}`,

    createBookmark: `package main

import (
    "bytes"
    "encoding/json"
    "io"
    "net/http"
)

type BookmarkPayload struct {
    Title       string \`json:"title"\`
    URL         string \`json:"url"\`
    Description string \`json:"description"\`
    IsPublic    bool   \`json:"isPublic"\`
}

func main() {
    payload := BookmarkPayload{
        Title:       "My Bookmark",
        URL:         "https://example.com",
        Description: "A great resource",
        IsPublic:    false,
    }
    jsonData, _ := json.Marshal(payload)

    req, _ := http.NewRequest("POST",
        "https://bookmark-api.example.com/api/bookmarks",
        bytes.NewBuffer(jsonData))
    
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", "Bearer YOUR_API_TOKEN")
    
    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    
    body, _ := io.ReadAll(resp.Body)
    println(string(body))
}`,

    updateBookmark: `package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

type UpdatePayload struct {
    Title    string \`json:"title"\`
    IsPublic bool   \`json:"isPublic"\`
}

func main() {
    payload := UpdatePayload{
        Title:    "Updated Title",
        IsPublic: true,
    }
    jsonData, _ := json.Marshal(payload)

    req, _ := http.NewRequest("PATCH",
        "https://bookmark-api.example.com/api/bookmarks/1",
        bytes.NewBuffer(jsonData))
    
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", "Bearer YOUR_API_TOKEN")
    
    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    
    body, _ := io.ReadAll(resp.Body)
    println(string(body))
}`,

    deleteBookmark: `package main

import (
    "io"
    "net/http"
)

func main() {
    req, _ := http.NewRequest("DELETE",
        "https://bookmark-api.example.com/api/bookmarks/1",
        nil)
    
    req.Header.Set("Authorization", "Bearer YOUR_API_TOKEN")
    
    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    
    println("Deleted:", resp.StatusCode == 204)
}`,

    createToken: `package main

import (
    "bytes"
    "encoding/json"
    "io"
    "net/http"
)

type TokenPayload struct {
    Label string \`json:"label"\`
}

func main() {
    payload := TokenPayload{Label: "My App Token"}
    jsonData, _ := json.Marshal(payload)

    req, _ := http.NewRequest("POST",
        "https://bookmark-api.example.com/api/tokens",
        bytes.NewBuffer(jsonData))
    
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", "Bearer YOUR_EXISTING_TOKEN")
    
    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    
    body, _ := io.ReadAll(resp.Body)
    println(string(body))
}`
  }
};

type Language = 'nodejs' | 'python' | 'go';
type Operation = 'register' | 'login' | 'listBookmarks' | 'createBookmark' | 'updateBookmark' | 'deleteBookmark' | 'createToken';

interface CodeBlock {
  title: string;
  description: string;
  operation: Operation;
}

const operations: CodeBlock[] = [
  {
    title: "Register User",
    description: "Create a new user account",
    operation: "register"
  },
  {
    title: "Login",
    description: "Sign in with username and password",
    operation: "login"
  },
  {
    title: "List Bookmarks",
    description: "Fetch all your bookmarks with pagination",
    operation: "listBookmarks"
  },
  {
    title: "Create Bookmark",
    description: "Add a new bookmark",
    operation: "createBookmark"
  },
  {
    title: "Update Bookmark",
    description: "Update an existing bookmark",
    operation: "updateBookmark"
  },
  {
    title: "Delete Bookmark",
    description: "Remove a bookmark",
    operation: "deleteBookmark"
  },
  {
    title: "Create API Token",
    description: "Generate an API token for programmatic access",
    operation: "createToken"
  }
];

function CodeBlock({ code, language }: { code: string; language: Language }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto max-h-96 overflow-y-auto">
        <code className="text-muted-foreground">{code}</code>
      </pre>
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-2 right-2"
        onClick={handleCopy}
        data-testid={`button-copy-${language}`}
      >
        {copied ? (
          <>
            <CheckCircle className="w-4 h-4 mr-1" />
            Copied
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 mr-1" />
            Copy
          </>
        )}
      </Button>
    </div>
  );
}

export default function ApiDocs() {
  const [selectedOperation, setSelectedOperation] = useState<Operation>("register");

  const currentCode = codeExamples[('nodejs' as Language)][selectedOperation as Operation];
  const currentBlock = operations.find(op => op.operation === selectedOperation)!;

  return (
    <Layout>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold font-display tracking-tight text-foreground">
            API Documentation
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Learn how to integrate the Bookmark API into your application
          </p>
        </div>

        {/* Quick Start Card */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Authentication Methods</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Session Authentication</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Use username/password login to get session cookies
              </p>
              <code className="bg-background px-3 py-2 rounded text-sm">
                POST /api/login
              </code>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Token Authentication (API Tokens)</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Generate API tokens from settings for programmatic access
              </p>
              <code className="bg-background px-3 py-2 rounded text-sm">
                Authorization: Bearer YOUR_API_TOKEN
              </code>
            </div>
          </CardContent>
        </Card>

        {/* API Reference */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">API Reference</h2>

          {/* Operation Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {operations.map(op => (
              <button
                key={op.operation}
                onClick={() => setSelectedOperation(op.operation)}
                className={`p-4 rounded-md text-left transition-all ${
                  selectedOperation === op.operation
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border hover:bg-muted"
                }`}
                data-testid={`button-operation-${op.operation}`}
              >
                <div className="font-semibold text-sm">{op.title}</div>
                <div className={`text-xs ${
                  selectedOperation === op.operation
                    ? "text-primary-foreground/80"
                    : "text-muted-foreground"
                }`}>
                  {op.description}
                </div>
              </button>
            ))}
          </div>

          {/* Code Examples */}
          <Card>
            <CardHeader>
              <CardTitle>{currentBlock.title}</CardTitle>
              <CardDescription>{currentBlock.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="nodejs" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="nodejs">Node.js</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="go">Go</TabsTrigger>
                </TabsList>

                <div className="mt-6">
                  <TabsContent value="nodejs" className="space-y-4">
                    <CodeBlock 
                      code={codeExamples.nodejs[selectedOperation]} 
                      language="nodejs"
                    />
                  </TabsContent>

                  <TabsContent value="python" className="space-y-4">
                    <CodeBlock 
                      code={codeExamples.python[selectedOperation]} 
                      language="python"
                    />
                  </TabsContent>

                  <TabsContent value="go" className="space-y-4">
                    <CodeBlock 
                      code={codeExamples.go[selectedOperation]} 
                      language="go"
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>

          {/* Endpoints Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Endpoint Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded text-xs font-mono">POST</span>
                  <code className="flex-1">/api/register</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded text-xs font-mono">POST</span>
                  <code className="flex-1">/api/login</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-1 rounded text-xs font-mono">GET</span>
                  <code className="flex-1">/api/auth/me</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded text-xs font-mono">POST</span>
                  <code className="flex-1">/api/auth/logout</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-1 rounded text-xs font-mono">GET</span>
                  <code className="flex-1">/api/bookmarks</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded text-xs font-mono">POST</span>
                  <code className="flex-1">/api/bookmarks</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded text-xs font-mono">PATCH</span>
                  <code className="flex-1">/api/bookmarks/:id</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-red-500/20 text-red-700 dark:text-red-400 px-2 py-1 rounded text-xs font-mono">DELETE</span>
                  <code className="flex-1">/api/bookmarks/:id</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-1 rounded text-xs font-mono">GET</span>
                  <code className="flex-1">/api/tokens</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded text-xs font-mono">POST</span>
                  <code className="flex-1">/api/tokens</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-red-500/20 text-red-700 dark:text-red-400 px-2 py-1 rounded text-xs font-mono">DELETE</span>
                  <code className="flex-1">/api/tokens/:id</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
