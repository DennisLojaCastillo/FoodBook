// Comment model - MongoDB collection handler
// Implementeres senere med MongoDB connection

class CommentModel {
  constructor(db) {
    this.collection = db.collection('comments');
  }

  // Placeholder methods - implementeres senere
  async createComment(commentData) {
    // Implementeres senere
    console.log('createComment method - implementeres snart!');
  }

  async getCommentsByRecipe(recipeId) {
    // Implementeres senere
    console.log('getCommentsByRecipe method - implementeres snart!');
  }

  async updateComment(id, updateData) {
    // Implementeres senere
    console.log('updateComment method - implementeres snart!');
  }

  async deleteComment(id) {
    // Implementeres senere
    console.log('deleteComment method - implementeres snart!');
  }

  async deleteCommentsByRecipe(recipeId) {
    // Implementeres senere
    console.log('deleteCommentsByRecipe method - implementeres snart!');
  }
}

export default CommentModel; 