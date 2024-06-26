const { User, OTP } = require('../db/models'); // Import your User model
const { Op } = require('sequelize');

class UserServices {

	static async SelectUserByChatIdAndINN(INN, chatId) {
		try {
      const user = await User.findOne({ where: { INN, ChatID: chatId } });
      return user;
    } catch (error) {
      console.error('Error finding user:', error);
      throw new Error('Error finding user');
    }
	}

	static async findLoggedInUsersByINNs(INNs) {
    try {
      const users = await User.findAll({
        where: {
          INN: INNs,
          loggedIn: true
        }
      });
      return users;
    } catch (error) {
      console.error('Error fetching logged-in users:', error);
      throw new Error('Error fetching logged-in users');
    }
  }

	static async DeactivateUser(INN){
		try {
      const user = await User.findOne({ where: { INN } });
      if (user) {
        user.loggedIn = false;
				await user.save();
				return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
	}
	
	static async ActivateUser(INN){
		try {
      const user = await User.findOne({ where: { INN } });
      if (user) {
        user.loggedIn = true;
        await user.save();
        return true;
      } else {
				return false;
			}
    } catch (error) {
      return false;
    }
	}
	static async DeleteUserConnection(INN, chatId){
		try {
      const user = await User.findOne({ where: { INN, ChatID: chatId } });
      if (user) {
        await user.destroy();
      } else {
        throw new Error('User not found');
      }
    } catch (error) {
      throw new Error(`Could not create user ${error}`);
    }
	}
	static async CreateUserWithINN(INN, chatId, code, expiryDate){ 
		try {
      const user = await this.createUser({INN, ChatID: chatId});
      if (user) {
        // generate a code
        await OTP.create({
          otp: code,
          User_id: user.id,
          expiry: expiryDate,
        });
        return {code,expiryDate};
      } else {
        throw new Error('User not found');
      }
    } catch (error) {
      throw new Error(`Could not create user ${error}`);
    } 
	}
	
	static async verify_user(user){
		try {
      if (user) {
				await user.update({...user, loggedIn : true, wasActivatedBefore: true});
      } else {
        throw new Error('User not found');
      }
    } catch (error) {
      throw new Error(`Could not create user ${error}`);
    }
	}

	static async updateUserAndCreateOTP(INN, chatId, code, expiryDate) {
  try {
    const { user, message } = await this.findByINN(INN);
    if (!user) {
      throw new Error('User not found');
    }
    await user.update({ ChatID: chatId, loggedIn: false });
    await OTP.create({
      otp: code,
      User_id: user.id,
      expiry: expiryDate,
    });
    return {code, expiryDate};
  } catch (error) {
    throw new Error(`Could not update user and create OTP: ${error.message}`);
  }
}

	// Function to create a new user
	static async createUser(data) {
		try {
			const user = await User.create(data);
			return user;
		} catch (error) {
			throw new Error(`Could not create user ${error}`);
		}
	}
	
	// Function to get all users
	static async getAllUsers() {
		try {
			const users = await User.findAll();
			return users;
		} catch (error) {
			throw new Error('Could not retrieve users');
		}
	}

	// Function to get a user by ID
	static async getUserById(id) {
		try {
			const user = await User.findByPk(id);
			if (!user) {
				throw new Error('User not found');
			}
			return user;
		} catch (error) {
			throw new Error('Could not retrieve user');
		}
	}

	// Function to update a user
	static async updateUser(id, data) {
		try {
			const user = await User.findByPk(id);
			if (!user) {
				throw new Error('User not found');
			}
			await user.update(data);
			return user;
		} catch (error) {
			throw new Error('Could not update user');
		}
	}

	// Function to delete a user
	static async deleteUser(id) {
		try {
			const user = await User.findByPk(id);
			if (!user) {
				throw new Error('User not found');
			}
			await user.destroy();
			return user;
		} catch (error) {
			throw new Error('Could not delete user');
		}
	}

	//iside chat
	static async findByINN(searchString) {
		try {
			const user = await User.findOne({
				where: { INN: searchString },
			});
			if (user.ChatID != null && user.loggedIn) {
				return { user: user, message: 'User already has a chat ID' };
			}
			return { user: user };
		} catch (error) {
			console.log(error);
			return false;
			// throw new Error("Could not find user");
		}
	}

	static async assignChatID(user, chatID) {
		try {
			user.ChatID = chatID;
			user.loggedIn = true
			await user.save();
			return user;
		} catch (error) {
			return false;
		}
	}

	// Function to get a user by ID
	static async getUserIdByINN(searchString) {
		try {
			const user = await User.findOne({
				where: { INN: searchString },
			});
			if (!user) {
				throw new Error('User not found');
			}
			return user.id;
		} catch (error) {
			throw new Error('Could not retrieve user id');
		}
	}

	static async findByChatID(chatID) {
		try {
			// Ensure chatID is a string for comparison
			const user = await User.findOne({
				where: { ChatID: String(chatID) },
			});
	
			// Log the user object for debugging purposes
			console.log(`User found for ChatID ${chatID}:`, user);
	
			// Check if user exists and is logged in
			if (user && user.loggedIn) {
				return user;
			} else {
				// Return null if the user is not found or not logged in
				return null;
			}
		} catch (error) {
			// Log the detailed error for debugging
			console.error(`Database error retrieving user by ChatID ${chatID}:`, error);
			throw new Error('Could not retrieve user by ChatID');
		}
	}
		static async updateUserLang(chatId, lang) {
		try {
			const user = await User.findOne({
				where: { ChatID: String(chatId) },
			});
			await user.update({...user, lang: lang});
			return user;
		} catch (error) {
			throw new Error(`Error updating user language: ${error.message}`);
		}
	}

	static async updatePassword(INN, password, repeatPassword){
		try {
      const user = await User.findOne({
        where: { INN: INN },
      });
      if (!user) {
        throw new Error('User not found');
      }
      if (password!== repeatPassword) {
        throw new Error('Passwords do not match');
      }
      await user.update({...user, Auth:  password });
      return true;
    } catch (error) {
      throw new Error(`Error updating user password: ${error.message}`);
			return false;
    }
	}
}

module.exports = UserServices;
