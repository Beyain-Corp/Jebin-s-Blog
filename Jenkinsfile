pipeline {
    agent any

    // Run automatically every 2 minutes
    triggers {
        cron('H/2 * * * *')
    }

    options {
        timeout(time: 10, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    environment {
        // Notion Database ID for Blog
        NOTION_DATABASE_ID = '418ae0c306ff80169771de6884e226f5'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Sync from Notion') {
            steps {
                script {
                    // Try to load Notion API Key from Jenkins Credentials ('notion-api-key' or 'NOTION_API_KEY')
                    try {
                        withCredentials([string(credentialsId: 'notion-api-key', variable: 'KEY')]) {
                            env.NOTION_API_KEY = env.KEY
                        }
                    } catch (Exception e1) {
                        try {
                            withCredentials([string(credentialsId: 'NOTION_API_KEY', variable: 'KEY')]) {
                                env.NOTION_API_KEY = env.KEY
                            }
                        } catch (Exception e2) {
                            echo "[INFO] Using NOTION_API_KEY from environment or .env.local"
                        }
                    }
                }
                sh '''
                    echo "[INFO] Node environment check:"
                    node -v || (echo "[ERROR] Node.js is required on Jenkins agent" && exit 1)

                    echo "[INFO] Running Notion Blog Sync Engine..."
                    node scripts/sync-notion.mjs
                '''
            }
        }

        stage('Commit & Push to GitHub') {
            steps {
                // Uses working Jenkins Credential 'github-pat-jebin' (same as Jebin_Portfolio)
                withCredentials([usernamePassword(credentialsId: 'github-pat-jebin', usernameVariable: 'GH_USER', passwordVariable: 'GH_TOKEN')]) {
                    sh '''
                        git config user.name "Jenkins Automation [OCI]"
                        git config user.email "jenkins-bot@beyain-corp.com"

                        # Stage Notion content artifacts
                        git add data/ static/media/ src/data/ public/media/

                        # Check if any changes were staged
                        if ! git diff --staged --quiet; then
                            echo "[INFO] New Notion articles or updates detected. Committing..."
                            git commit -m "chore(notion): auto-sync published articles [skip ci]"

                            echo "[INFO] Pushing to GitHub main branch..."
                            git push https://x-access-token:${GH_TOKEN}@github.com/Beyain-Corp/Jebin-s-Blog.git HEAD:main
                            echo "[SUCCESS] Successfully synchronized Notion to GitHub! GitHub Pages will auto-deploy."
                        else
                            echo "[INFO] No Notion changes detected. Repository is up to date."
                        fi
                    '''
                }
            }
        }
    }

    post {
        failure {
            echo "[ALERT] Jenkins Notion sync pipeline failed on OCI instance (129.225.114.209:1010). Check console output."
        }
    }
}
