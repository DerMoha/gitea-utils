import axios from 'axios';

export class GiteaService {
    constructor(baseURL, token, httpClient = null) {
        this.client = httpClient || axios.create({
            baseURL: `${baseURL}/api/v1`,
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
    }

    async getRepos() {
        const res = await this.client.get('/user/repos?limit=500');
        return res.data;
    }

    async createRepo(name, description, isPrivate) {
        const res = await this.client.post('/user/repos', {
            name,
            description,
            private: isPrivate,
            auto_init: true
        });
        return res.data;
    }

    async deleteRepo(owner, repo) {
        await this.client.delete(`/repos/${owner}/${repo}`);
    }

    async getUsers() {
        const res = await this.client.get('/admin/users');
        return res.data;
    }

    async createUser(username, email, password) {
        const res = await this.client.post('/admin/users', {
            login_name: username,
            username,
            email,
            password,
            must_change_password: false
        });
        return res.data;
    }

    async createBranch(owner, repo, newBranch, oldBranch = 'main') {
        const res = await this.client.post(`/repos/${owner}/${repo}/branches`, {
            new_branch_name: newBranch,
            old_branch_name: oldBranch
        });
        return res.data;
    }

    async createMilestone(owner, repo, title, description, dueOn) {
        const body = { title, description };
        if (dueOn) body.due_on = dueOn;
        
        const res = await this.client.post(`/repos/${owner}/${repo}/milestones`, body);
        return res.data;
    }
}