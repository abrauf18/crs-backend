module.exports = (sequelize, DataTypes) => {
  const ForgotPasswordRequest = sequelize.define("ForgotPasswordRequest", {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  });

  ForgotPasswordRequest.associate = (models) => {
    ForgotPasswordRequest.belongsTo(models.User, {
      foreignKey: "userId",
      onDelete: "CASCADE",
    });
  };

  // Invite.sync({ force: true });

  return ForgotPasswordRequest;
};
